"""
Database Connection and Initialization Layer
Dual Connection Manager:
- Hosted Supabase PostgreSQL via psycopg 3 ConnectionPool when DATABASE_URL is set.
- Local SQLite fallback when DATABASE_URL is empty.
Owned by: Nagin (Supabase Database Architecture) & Arsh (Backend)
"""

import logging
import os
import sqlite3
from contextlib import contextmanager
from typing import Any

from ..config import settings

logger = logging.getLogger(__name__)

# psycopg 3 imports
try:
    import psycopg
    from psycopg.rows import dict_row
    from psycopg_pool import ConnectionPool

    PSYCOPG_AVAILABLE = True
except ImportError:
    PSYCOPG_AVAILABLE = False
    dict_row = None
    ConnectionPool = None


class DatabaseConnectionError(Exception):
    """Raised when database connection fails without leaking secrets."""


_pool: Any | None = None


class PostgresCursorWrapper:
    """Cursor wrapper that translates '?' placeholders to '%s' for psycopg 3."""

    def __init__(self, raw_cursor):
        self._cur = raw_cursor

    def execute(self, query: str, params=None):
        if params is not None:
            translated_query = query.replace("?", "%s") if "?" in query else query
            return self._cur.execute(translated_query, params)
        return self._cur.execute(query)

    def executemany(self, query: str, params_seq):
        translated_query = query.replace("?", "%s") if "?" in query else query
        return self._cur.executemany(translated_query, params_seq)

    @staticmethod
    def _normalize_row(row):
        if not row or not isinstance(row, dict):
            return row
        return {
            k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in row.items()
        }

    def fetchone(self):
        row = self._cur.fetchone()
        return self._normalize_row(row)

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return rows
        return [self._normalize_row(r) for r in rows]

    @property
    def rowcount(self):
        return self._cur.rowcount

    def __getattr__(self, name):
        return getattr(self._cur, name)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._cur.__exit__(exc_type, exc_val, exc_tb)


class PostgresConnectionWrapper:
    """Connection wrapper that returns PostgresCursorWrapper cursors."""

    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self, *args, **kwargs):
        cur = self._conn.cursor(*args, **kwargs)
        return PostgresCursorWrapper(cur)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self._conn.rollback()
        else:
            self._conn.commit()
        return False


def get_db_path() -> str:
    path = settings.DATABASE_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def get_db_pool() -> Any:
    """Returns or initializes the psycopg 3 connection pool."""
    global _pool
    if not PSYCOPG_AVAILABLE:
        raise DatabaseConnectionError(
            "psycopg and psycopg_pool must be installed for PostgreSQL support."
        )

    if _pool is not None and not _pool.closed:
        return _pool

    database_url = settings.DATABASE_URL
    if not database_url:
        raise DatabaseConnectionError("DATABASE_URL is not set.")

    # Enforce SSL for PostgreSQL connection unless sslmode is explicitly defined
    conn_kwargs = {"row_factory": dict_row, "autocommit": False}
    if "sslmode=" not in database_url.lower():
        conn_kwargs["sslmode"] = "require"

    try:
        _pool = ConnectionPool(
            conninfo=database_url,
            min_size=1,
            max_size=10,
            timeout=10.0,
            max_idle=300.0,
            kwargs=conn_kwargs,
            open=True,
        )
        return _pool
    except Exception:
        sanitized = settings.sanitized_database_url
        raise DatabaseConnectionError(
            f"Failed to initialize PostgreSQL connection pool to {sanitized}: connection error."
        ) from None


def close_db_pool() -> None:
    """Gracefully closes the PostgreSQL connection pool."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
        except Exception:
            pass
        finally:
            _pool = None


@contextmanager
def get_db():
    """
    Context manager for database connections:
    - When DATABASE_URL is set: acquires connection from psycopg 3 pool.
      Strictly raises DatabaseConnectionError on failure (NO silent fallback to SQLite).
    - When DATABASE_URL is empty: uses local SQLite with Row factory.
    """
    if settings.is_postgres:
        pool = get_db_pool()
        try:
            with pool.connection() as conn:
                wrapper = PostgresConnectionWrapper(conn)
                yield wrapper
        except DatabaseConnectionError:
            raise
        except Exception as exc:
            raise DatabaseConnectionError(
                f"PostgreSQL query execution failed: {type(exc).__name__}: {exc}"
            ) from exc
    else:
        conn = sqlite3.connect(get_db_path(), timeout=10.0, check_same_thread=False)
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def ping_db() -> dict[str, Any]:
    """Read-only SELECT 1 connectivity check."""
    if settings.is_postgres:
        try:
            with get_db() as conn, conn.cursor() as cur:
                cur.execute("SELECT 1 AS alive;")
                row = cur.fetchone()
                if row and (
                    row.get("alive") == 1
                    or row.get("?column?") == 1
                    or list(row.values())[0] == 1
                ):
                    return {
                        "status": "healthy",
                        "engine": "PostgreSQL (Supabase)",
                        "connected": True,
                        "sanitized_url": settings.sanitized_database_url,
                    }
            return {
                "status": "degraded",
                "engine": "PostgreSQL (Supabase)",
                "connected": False,
                "error": "SELECT 1 returned unexpected output",
            }
        except Exception as exc:
            return {
                "status": "unhealthy",
                "engine": "PostgreSQL (Supabase)",
                "connected": False,
                "error": f"Connection failed ({type(exc).__name__})",
            }
    else:
        try:
            with get_db() as conn:
                cur = conn.cursor()
                cur.execute("SELECT 1 AS alive;")
                row = cur.fetchone()
                if row and row["alive"] == 1:
                    return {
                        "status": "healthy",
                        "engine": "SQLite Demo Persistence (File-backed)",
                        "connected": True,
                        "path": settings.DATABASE_PATH,
                    }
            return {
                "status": "degraded",
                "engine": "SQLite",
                "connected": False,
                "error": "SQLite SELECT 1 failed",
            }
        except Exception as exc:
            return {
                "status": "unhealthy",
                "engine": "SQLite",
                "connected": False,
                "error": str(exc),
            }


def verify_authorization() -> dict[str, Any]:
    """Verifies the active database role and RLS bypass permissions for PostgreSQL."""
    if not settings.is_postgres:
        return {"engine": "sqlite", "rls_applicable": False, "authorized": True}
    try:
        with get_db() as conn, conn.cursor() as cur:
            cur.execute("""
                    SELECT current_user AS role_name,
                           rolsuper AS is_superuser,
                           rolbypassrls AS bypasses_rls
                    FROM pg_roles
                    WHERE rolname = current_user;
                """)
            row = cur.fetchone()
            if row:
                return {
                    "engine": "postgresql",
                    "current_user": row.get("role_name"),
                    "is_superuser": bool(row.get("is_superuser")),
                    "bypasses_rls": bool(row.get("bypasses_rls")),
                    "authorized": True,
                }
            return {
                "engine": "postgresql",
                "current_user": "unknown",
                "authorized": False,
                "error": "Could not inspect role in pg_roles",
            }
    except Exception as exc:
        return {
            "engine": "postgresql",
            "authorized": False,
            "error": f"Authorization verification query failed: {type(exc).__name__}",
        }


# ============================================================================
# CURRICULUM SEED DATA (Synchronized with PostgreSQL Migrations 0001 & 0004)
# ============================================================================

SEEDED_SUBJECTS = [
    (
        "subj_python",
        "python",
        "Python Programming",
        "Master core Python semantics, data structures, and idiomatic problem-solving.",
        "python",
        1,  # Active in demo
        5,
        "Beginner to Intermediate",
    ),
    (
        "subj_webdev",
        "webdev",
        "Modern Full-Stack Web",
        "React, TypeScript, state machines, and modern client-server architecture.",
        "globe",
        0,  # Inactive (Coming Soon)
        5,
        "Coming Soon",
    ),
    (
        "subj_datasci",
        "datasci",
        "Data Science & ML",
        "NumPy, Pandas, model evaluation metrics, and exploratory data analysis.",
        "database",
        0,  # Inactive (Coming Soon)
        5,
        "Coming Soon",
    ),
    (
        "subj_cloud",
        "cloud",
        "Cloud & DevOps Architecture",
        "Containerization, CI/CD pipelines, and scalable cloud services.",
        "cloud",
        0,  # Inactive (Coming Soon)
        5,
        "Coming Soon",
    ),
    (
        "subj_biology",
        "biology",
        "Foundational Biology",
        "Explore cellular mechanisms, molecular genetics, photosynthesis, and core biochemical processes.",
        "activity",
        0,  # Inactive (deployment-blocked pending team approval)
        5,
        "Beginner",
    ),
    (
        "subj_business",
        "business",
        "Business & Entrepreneurship",
        "Master financial accounting statements, supply and demand dynamics, unit economics, and competitive moats.",
        "briefcase",
        0,  # Inactive (deployment-blocked pending team approval)
        5,
        "Beginner",
    ),
    (
        "subj_aiml",
        "aiml",
        "Artificial Intelligence & Machine Learning",
        "Understand machine learning paradigms, model generalization, classification metrics, and neural network foundations.",
        "cpu",
        0,  # Inactive (deployment-blocked pending team approval)
        5,
        "Beginner",
    ),
]

SEEDED_QUESTIONS = [
    # ------------------------------------------------------------------------
    # 1. Python Programming (subj_python) - Questions 1 to 5
    # ------------------------------------------------------------------------
    (
        "q_py_1",
        "subj_python",
        1,
        "Consider the function definition:\ndef append_item(val, container=[]):\n    container.append(val)\n    return container\n\nWhat is returned after calling append_item(1) followed by append_item(2)?",
        "append_item(2) returns [2]",
        "append_item(2) returns [1, 2]",
        "A TypeError is raised because default arguments must be immutable",
        "append_item(2) returns [[1], [2]]",
        "B",
        "In Python, default parameter expressions are evaluated once when the function is defined, NOT each time it is invoked. Because lists are mutable, subsequent calls share the exact same default list instance unless overridden.",
        "Default Parameter Evaluation & Mutability",
        "Intermediate",
    ),
    (
        "q_py_2",
        "subj_python",
        2,
        "Given data = [10, 20, 30, 40, 50], what does the slicing expression data[1:4:-1] produce?",
        "[40, 30, 20]",
        "[40, 30]",
        "[] (an empty list)",
        "[20, 30, 40]",
        "C",
        "The slice notation is [start:stop:step]. When step is -1, Python decrements from start down towards stop. Since start (1) is less than stop (4) and step is negative, the loop cannot proceed backwards, returning an empty list []. To slice in reverse from index 3 down to 1, one would write data[3:0:-1].",
        "Sequence Slicing & Negative Steps",
        "Intermediate",
    ),
    (
        "q_py_3",
        "subj_python",
        3,
        'Why does attempting lookup = { [1, 2]: "coords" } raise a TypeError: unhashable type: "list", whereas lookup = { (1, 2): "coords" } succeeds?',
        "Dictionaries can only store single primitive numbers or strings as keys",
        "Tuples have lower memory overhead than lists",
        "Dictionary keys must be hashable and immutable so their hash bucket remains invariant throughout execution",
        "Python syntax requires commas to be enclosed in parentheses",
        "C",
        "Python dictionaries use hash tables for O(1) key lookups. Keys must implement __hash__() and remain invariant. Since lists are mutable (their contents and identity can change), they are unhashable. Tuples containing only immutable elements are hashable.",
        "Hash Tables, Mutability & Dictionary Keys",
        "Beginner to Intermediate",
    ),
    (
        "q_py_4",
        "subj_python",
        4,
        "What is the fundamental operational difference between nums_sq = [x*x for x in range(1000000)] and gen_sq = (x*x for x in range(1000000))?",
        "The list comprehension executes faster in all memory scenarios",
        "The generator expression produces a generator object that evaluates items lazily on demand without allocating memory for 1,000,000 items upfront",
        "Generators can only produce integer values, whereas list comprehensions accept any data type",
        "There is no difference; parentheses in comprehensions are just alternative syntax",
        "B",
        "Square brackets [...] evaluate the list comprehension immediately and allocate memory for the entire million-element list in RAM. Parentheses (...) create a generator expression which uses lazy evaluation, computing values one by one on demand with O(1) memory overhead.",
        "List Comprehensions vs Generator Expressions",
        "Intermediate",
    ),
    (
        "q_py_5",
        "subj_python",
        5,
        "In Python variable scope resolution (the LEGB rule), which order of namespaces does the interpreter search when looking up an identifier?",
        "Local -> Enclosing -> Global -> Built-in",
        "Global -> Local -> Enclosing -> Built-in",
        "Built-in -> Global -> Enclosing -> Local",
        "Local -> Global -> Enclosing -> Built-in",
        "A",
        "Python resolves names using the LEGB rule: 1) Local (inside the current function), 2) Enclosing (in any enclosing nested functions/closures), 3) Global (at the module level), and 4) Built-in (standard Python builtins like print, len, range).",
        "LEGB Variable Scope & Closures",
        "Intermediate",
    ),
    # ------------------------------------------------------------------------
    # 2. Foundational Biology (subj_biology) - Questions 1 to 5
    # ------------------------------------------------------------------------
    (
        "q_bio_1",
        "subj_biology",
        1,
        "Which organelle is responsible for generating the majority of cellular energy (ATP) through cellular respiration?",
        "Endoplasmic Reticulum",
        "Golgi Apparatus",
        "Mitochondria",
        "Ribosome",
        "C",
        "Mitochondria generate adenosine triphosphate (ATP) via the Krebs cycle and oxidative phosphorylation, earning their title as cellular powerhouses.",
        "Cellular Biology & Organelles",
        "Beginner",
    ),
    (
        "q_bio_2",
        "subj_biology",
        2,
        "In double-stranded DNA structure, which nitrogenous base always pairs with Adenine (A) via two hydrogen bonds?",
        "Cytosine (C)",
        "Thymine (T)",
        "Guanine (G)",
        "Uracil (U)",
        "B",
        "Under Chargaff's rules of complementary base pairing, Adenine pairs with Thymine in DNA via two hydrogen bonds, whereas Guanine pairs with Cytosine via three.",
        "Molecular Genetics & DNA Structure",
        "Beginner",
    ),
    (
        "q_bio_3",
        "subj_biology",
        3,
        "What is the primary photosynthetic pigment in plant chloroplasts responsible for absorbing light energy?",
        "Carotenoid",
        "Chlorophyll",
        "Anthocyanin",
        "Hemoglobin",
        "B",
        "Chlorophyll absorbs blue and red wavelengths while reflecting green light, converting solar photon energy into chemical energy during the light-dependent reactions.",
        "Plant Biology & Photosynthesis",
        "Beginner",
    ),
    (
        "q_bio_4",
        "subj_biology",
        4,
        "If two heterozygous pea plants (Bb) for purple flower color are crossed, what is the expected phenotypic ratio of purple to white flowers?",
        "1:1",
        "2:1",
        "3:1",
        "4:0",
        "C",
        "A monohybrid cross of Bb x Bb yields genotypes 1 BB : 2 Bb : 1 bb. Because the B allele is dominant, both BB and Bb display purple flowers, resulting in a 3:1 phenotypic ratio.",
        "Mendelian Genetics",
        "Beginner",
    ),
    (
        "q_bio_5",
        "subj_biology",
        5,
        "How do biological enzymes speed up biochemical reactions in living organisms?",
        "By raising the surrounding ambient temperature",
        "By lowering the activation energy barrier",
        "By shifting the final chemical equilibrium toward reactants",
        "By consuming substrate molecules permanently",
        "B",
        "Enzymes act as biological catalysts by stabilizing the reaction transition state and lowering the activation energy barrier without being consumed in the process.",
        "Biochemistry & Enzyme Kinetics",
        "Beginner",
    ),
    # ------------------------------------------------------------------------
    # 3. Business & Entrepreneurship (subj_business) - Questions 1 to 5
    # ------------------------------------------------------------------------
    (
        "q_bus_1",
        "subj_business",
        1,
        "Which core financial statement summarizes a company's assets, liabilities, and shareholders' equity at a specific point in time?",
        "Income Statement (P&L)",
        "Cash Flow Statement",
        "Balance Sheet",
        "Statement of Retained Earnings",
        "C",
        "The Balance Sheet reflects the foundational accounting identity (Assets = Liabilities + Equity) at a single snapshot date, unlike the Income Statement which measures flows over time.",
        "Financial Accounting & Statements",
        "Beginner",
    ),
    (
        "q_bus_2",
        "subj_business",
        2,
        "In basic microeconomics, what happens to the market equilibrium price when consumer demand rises while supply remains fixed?",
        "Equilibrium price decreases",
        "Equilibrium price increases",
        "Equilibrium price remains unchanged",
        "Market supply drops immediately to zero",
        "B",
        "When market demand shifts outward against a fixed supply curve, competition among buyers bids up the clearing price until equilibrium is restored.",
        "Microeconomics: Supply and Demand",
        "Beginner",
    ),
    (
        "q_bus_3",
        "subj_business",
        3,
        'In foundational marketing strategy, what are the components of the traditional "4 Ps" marketing mix?',
        "Product, Price, Place, Promotion",
        "Profit, People, Process, Performance",
        "Planning, Positioning, Packaging, Production",
        "Partner, Policy, Platform, Publicity",
        "A",
        "E. Jerome McCarthy defined the 4 Ps as Product (the offering), Price (monetization strategy), Place (distribution channels), and Promotion (communications and sales).",
        "Marketing Strategy & The 4 Ps",
        "Beginner",
    ),
    (
        "q_bus_4",
        "subj_business",
        4,
        "If a company has a Customer Acquisition Cost (CAC) of $100 and a Customer Lifetime Value (LTV) of $350, what does this indicate about unit economics?",
        "The company loses $250 on every customer acquired",
        "The company achieves an LTV:CAC ratio of 3.5:1, indicating healthy unit economics",
        "Customer churn rate is 100%",
        "The business should immediately halt all customer acquisition campaigns",
        "B",
        "An LTV:CAC ratio of 3:1 or higher is the classic benchmark for sustainable unit economics, proving customer gross value comfortably exceeds acquisition overhead.",
        "Unit Economics & Startup Metrics",
        "Beginner",
    ),
    (
        "q_bus_5",
        "subj_business",
        5,
        "What business term describes a company's sustainable competitive advantage that protects its market share and profits from rival entry?",
        "Working Capital",
        "Economic Moat",
        "Arbitrage",
        "Depreciation",
        "B",
        "An Economic Moat (such as network effects, brand pricing power, or high switching costs) shields a firm from competitive erosion over the long term.",
        "Strategic Management & Competitive Moats",
        "Beginner",
    ),
    # ------------------------------------------------------------------------
    # 4. Artificial Intelligence & Machine Learning (subj_aiml) - Questions 1 to 5
    # ------------------------------------------------------------------------
    (
        "q_aiml_1",
        "subj_aiml",
        1,
        "Which machine learning paradigm uses training datasets consisting of input features paired with known ground-truth output labels?",
        "Unsupervised Learning",
        "Supervised Learning",
        "Reinforcement Learning",
        "Self-Supervised Clustering",
        "B",
        "Supervised learning trains predictive models on labeled examples (X, y), enabling the model to learn mapping functions for regression or classification tasks.",
        "Machine Learning Paradigms",
        "Beginner",
    ),
    (
        "q_aiml_2",
        "subj_aiml",
        2,
        "What condition occurs when a machine learning model fits training data too closely, memorizing noise and failing on new unseen data?",
        "Underfitting",
        "Overfitting",
        "High Bias",
        "Vanishing Gradient",
        "B",
        "Overfitting (high variance) happens when a model learns training noise rather than true underlying patterns, leading to degraded generalization on evaluation test sets.",
        "Model Generalization & Overfitting",
        "Beginner",
    ),
    (
        "q_aiml_3",
        "subj_aiml",
        3,
        "In binary classification evaluation, which metric measures the proportion of actual positive cases that the model correctly identified?",
        "Precision",
        "Recall (Sensitivity)",
        "Specificity",
        "Mean Squared Error",
        "B",
        "Recall is calculated as True Positives / (True Positives + False Negatives), assessing a classifier's completeness in capturing positive condition instances.",
        "Evaluation Metrics: Precision vs Recall",
        "Beginner",
    ),
    (
        "q_aiml_4",
        "subj_aiml",
        4,
        "What foundational optimization algorithm iteratively adjusts model parameters in the opposite direction of the loss function gradient?",
        "Principal Component Analysis (PCA)",
        "Gradient Descent",
        "K-Means Clustering",
        "Monte Carlo Tree Search",
        "B",
        "Gradient Descent calculates the partial derivatives of the loss function with respect to weights and takes proportional steps downhill to minimize error.",
        "Optimization & Gradient Descent",
        "Beginner",
    ),
    (
        "q_aiml_5",
        "subj_aiml",
        5,
        "What is the primary function of an activation function (such as ReLU or Sigmoid) within an artificial neural network?",
        "To regulate physical CPU/GPU power consumption",
        "To introduce non-linearity so the network can learn complex patterns",
        "To automatically cluster unlabeled datasets",
        "To prune unused hidden layer neurons permanently",
        "B",
        "Without non-linear activation functions, multi-layer neural networks would collapse into a single linear transformation, unable to learn complex non-linear decision boundaries.",
        "Deep Learning & Activation Functions",
        "Beginner",
    ),
]

SEEDED_CHALLENGE = (
    "chal_today_py",
    "Python Daily Challenge: The List Mutation Trap",
    "Python List References & Shallow Copying",
    "Medium",
    "Determine the final output of the matrix operation where list multiplication creates shallow references instead of independent sublists.",
    "matrix = [[0] * 3] * 3\nmatrix[0][0] = 7\nprint([row[0] for row in matrix])",
    "multiple_choice",
    "[7, 0, 0]",
    "[7, 7, 7]",
    "[[7, 0, 0], [0, 0, 0], [0, 0, 0]]",
    "A TypeError occurs during inner assignment",
    "B",
    "When using `[[0] * 3] * 3`, the outer multiplication creates three references pointing to the exact same inner list in memory. Mutating `matrix[0][0] = 7` affects all three rows because they reference the identical object. To avoid this, use a comprehension: `[[0] * 3 for _ in range(3)]`.",
    50,
)


def init_db():
    """Initializes tables for SQLite, or verifies connectivity pool for PostgreSQL."""
    if settings.is_postgres:
        # PostgreSQL tables and seeds are managed by schema.sql and seed.sql.
        # Here we verify connectivity without modifying tables.
        res = ping_db()
        if not res["connected"]:
            raise DatabaseConnectionError(
                f"PostgreSQL startup verification failed: {res.get('error')}"
            )
        print("PragyaX Database Initialized with Supabase PostgreSQL pool.")
        return

    # SQLite demo initialization
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        # 1. Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. User Preferences (Enforces foreign key to subjects)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                selected_subject_id TEXT NOT NULL DEFAULT 'subj_python',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (selected_subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
            );
        """)

        # 3. Subjects
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'code',
                is_active INTEGER NOT NULL DEFAULT 0,
                question_count INTEGER NOT NULL DEFAULT 5,
                difficulty TEXT NOT NULL DEFAULT 'Beginner to Intermediate'
            );
        """)

        # 4. Assessment Questions (Enforces correct_option domain & subject/question_number uniqueness)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessment_questions (
                id TEXT PRIMARY KEY,
                subject_id TEXT NOT NULL,
                question_number INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
                explanation TEXT NOT NULL,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Intermediate',
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE (subject_id, question_number)
            );
        """)

        # 5. Learning Chat Messages (Enforces role domain)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subject TEXT NOT NULL DEFAULT 'Python Programming',
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                suggested_followups TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 6. Assessment Attempts (Persisted Evaluations)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessment_attempts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subject_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                total INTEGER NOT NULL,
                percentage REAL NOT NULL,
                proficiency_level TEXT NOT NULL,
                summary_feedback TEXT NOT NULL,
                recommended_topics TEXT NOT NULL,
                user_answers TEXT NOT NULL,
                breakdown TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
        """)

        # 7. Daily Challenges (Enforces correct_option domain)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_challenges (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Medium',
                description TEXT NOT NULL,
                code_snippet TEXT NOT NULL,
                question_type TEXT NOT NULL DEFAULT 'multiple_choice',
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
                explanation TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 8. User Challenge Submissions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_challenge_submissions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                submitted_answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                points_awarded INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, challenge_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE
            );
        """)

        # 9. User Badges & Achievements
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_badges (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                badge_key TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL,
                awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, badge_key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 10. Active Sessions / Tokens
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS active_sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 11. User Roadmap Module Progress (Local SQLite Persistence)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_roadmap_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subject_id TEXT NOT NULL,
                module_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'completed' CHECK (status = 'completed'),
                completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE (user_id, subject_id, module_id)
            );
        """)

        # --------------------------------------------------------------------
        # Performance and Integrity Indexes (Synchronized with Migration 0002)
        # --------------------------------------------------------------------
        performance_indexes = [
            "CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_created ON assessment_attempts (user_id, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages (user_id, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_questions_subject ON assessment_questions (subject_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_badges_user_awarded ON user_badges (user_id, awarded_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions (user_id);",
            "CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user_subject ON user_roadmap_progress (user_id, subject_id);",
        ]
        for idx_sql in performance_indexes:
            try:
                cursor.execute(idx_sql)
            except Exception as exc:
                logger.warning(f"Could not create SQLite index: {exc}")
        # Safe index on existing databases for assessment question unique slots
        try:
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_assessment_questions_subject_number
                ON assessment_questions (subject_id, question_number);
            """)
        except Exception as exc:
            logger.warning(
                f"Could not create unique index on assessment_questions(subject_id, question_number): {exc}"
            )

        # --------------------------------------------------------------------
        # Safe Idempotent Curriculum Seeding (Synchronized with Migrations 0001 & 0004)
        # --------------------------------------------------------------------
        # 1. Subjects (7 total: Python active, 6 inactive)
        cursor.executemany(
            """
            INSERT INTO subjects (id, slug, title, description, icon, is_active, question_count, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING;
        """,
            SEEDED_SUBJECTS,
        )

        # 2. Assessment Questions (20 total: exactly 5 MCQs per track)
        cursor.executemany(
            """
            INSERT INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING;
        """,
            SEEDED_QUESTIONS,
        )

        # 3. Daily Challenge (Ankush's Module)
        cursor.execute(
            """
            INSERT INTO daily_challenges (id, title, topic, difficulty, description, code_snippet, question_type, option_a, option_b, option_c, option_d, correct_option, explanation, points)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING;
        """,
            SEEDED_CHALLENGE,
        )
