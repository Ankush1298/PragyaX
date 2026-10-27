"""
Database Connection and Initialization Layer
Local SQLite Demo Fallback with automatic table creation & initial seeding.
Owned by: Nagin (Supabase Database Architecture) & Arsh (Backend)
"""

import sqlite3
import os
import json
from contextlib import contextmanager
from ..config import settings


def get_db_path() -> str:
    path = settings.DATABASE_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


@contextmanager
def get_db():
    """Context manager for SQLite connections with row factory enabled."""
    conn = sqlite3.connect(get_db_path(), timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initializes tables and seeds core subjects & assessment questions if absent."""
    with get_db() as conn:
        cursor = conn.cursor()

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

        # 2. User Preferences
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                selected_subject_id TEXT NOT NULL DEFAULT 'subj_python',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

        # 4. Assessment Questions
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
                correct_option TEXT NOT NULL,
                explanation TEXT NOT NULL,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Intermediate',
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
        """)

        # 5. Learning Chat Messages
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subject TEXT NOT NULL DEFAULT 'Python Programming',
                role TEXT NOT NULL,
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

        # 7. Daily Challenges (Ankush's Module)
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
                correct_option TEXT NOT NULL,
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

        # Seed initial subjects if empty
        cursor.execute("SELECT COUNT(*) AS cnt FROM subjects;")
        if cursor.fetchone()["cnt"] == 0:
            cursor.executemany("""
                INSERT INTO subjects (id, slug, title, description, icon, is_active, question_count, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, [
                ('subj_python', 'python', 'Python Programming', 'Master core Python semantics, data structures, and idiomatic problem-solving.', 'python', 1, 5, 'Beginner to Intermediate'),
                ('subj_webdev', 'webdev', 'Modern Full-Stack Web', 'React, TypeScript, state machines, and modern client-server architecture.', 'globe', 0, 5, 'Coming Soon'),
                ('subj_datasci', 'datasci', 'Data Science & ML', 'NumPy, Pandas, model evaluation metrics, and exploratory data analysis.', 'database', 0, 5, 'Coming Soon'),
                ('subj_cloud', 'cloud', 'Cloud & DevOps Architecture', 'Containerization, CI/CD pipelines, and scalable cloud services.', 'cloud', 0, 5, 'Coming Soon')
            ])

        # Seed the 5 Python assessment questions if empty
        cursor.execute("SELECT COUNT(*) AS cnt FROM assessment_questions WHERE subject_id = 'subj_python';")
        if cursor.fetchone()["cnt"] == 0:
            questions = [
                (
                    'q_py_1',
                    'subj_python',
                    1,
                    'Consider the function definition:\ndef append_item(val, container=[]):\n    container.append(val)\n    return container\n\nWhat is returned after calling append_item(1) followed by append_item(2)?',
                    'append_item(2) returns [2]',
                    'append_item(2) returns [1, 2]',
                    'A TypeError is raised because default arguments must be immutable',
                    'append_item(2) returns [[1], [2]]',
                    'B',
                    'In Python, default parameter expressions are evaluated once when the function is defined, NOT each time it is invoked. Because lists are mutable, subsequent calls share the exact same default list instance unless overridden.',
                    'Default Parameter Evaluation & Mutability',
                    'Intermediate'
                ),
                (
                    'q_py_2',
                    'subj_python',
                    2,
                    'Given data = [10, 20, 30, 40, 50], what does the slicing expression data[1:4:-1] produce?',
                    '[40, 30, 20]',
                    '[40, 30]',
                    '[] (an empty list)',
                    '[20, 30, 40]',
                    'C',
                    'The slice notation is [start:stop:step]. When step is -1, Python decrements from start down towards stop. Since start (1) is less than stop (4) and step is negative, the loop cannot proceed backwards, returning an empty list []. To slice in reverse from index 3 down to 1, one would write data[3:0:-1].',
                    'Sequence Slicing & Negative Steps',
                    'Intermediate'
                ),
                (
                    'q_py_3',
                    'subj_python',
                    3,
                    'Why does attempting lookup = { [1, 2]: "coords" } raise a TypeError: unhashable type: "list", whereas lookup = { (1, 2): "coords" } succeeds?',
                    'Dictionaries can only store single primitive numbers or strings as keys',
                    'Tuples have lower memory overhead than lists',
                    'Dictionary keys must be hashable and immutable so their hash bucket remains invariant throughout execution',
                    'Python syntax requires commas to be enclosed in parentheses',
                    'C',
                    'Python dictionaries use hash tables for O(1) key lookups. Keys must implement __hash__() and remain invariant. Since lists are mutable (their contents and identity can change), they are unhashable. Tuples containing only immutable elements are hashable.',
                    'Hash Tables, Mutability & Dictionary Keys',
                    'Beginner to Intermediate'
                ),
                (
                    'q_py_4',
                    'subj_python',
                    4,
                    'What is the fundamental operational difference between nums_sq = [x*x for x in range(1000000)] and gen_sq = (x*x for x in range(1000000))?',
                    'The list comprehension executes faster in all memory scenarios',
                    'The generator expression produces a generator object that evaluates items lazily on demand without allocating memory for 1,000,000 items upfront',
                    'Generators can only produce integer values, whereas list comprehensions accept any data type',
                    'There is no difference; parentheses in comprehensions are just alternative syntax',
                    'B',
                    'Square brackets [...] evaluate the list comprehension immediately and allocate memory for the entire million-element list in RAM. Parentheses (...) create a generator expression which uses lazy evaluation, computing values one by one on demand with O(1) memory overhead.',
                    'List Comprehensions vs Generator Expressions',
                    'Intermediate'
                ),
                (
                    'q_py_5',
                    'subj_python',
                    5,
                    'In Python variable scope resolution (the LEGB rule), which order of namespaces does the interpreter search when looking up an identifier?',
                    'Local -> Enclosing -> Global -> Built-in',
                    'Global -> Local -> Enclosing -> Built-in',
                    'Built-in -> Global -> Enclosing -> Local',
                    'Local -> Global -> Enclosing -> Built-in',
                    'A',
                    'Python resolves names using the LEGB rule: 1) Local (inside the current function), 2) Enclosing (in any enclosing nested functions/closures), 3) Global (at the module level), and 4) Built-in (standard Python builtins like print, len, range).',
                    'LEGB Variable Scope & Closures',
                    'Intermediate'
                )
            ]
            cursor.executemany("""
                INSERT INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, questions)

        # Seed Daily Challenge if empty
        cursor.execute("SELECT COUNT(*) AS cnt FROM daily_challenges;")
        if cursor.fetchone()["cnt"] == 0:
            cursor.execute("""
                INSERT INTO daily_challenges (id, title, topic, difficulty, description, code_snippet, question_type, option_a, option_b, option_c, option_d, correct_option, explanation, points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                'chal_today_py',
                'Python Daily Challenge: The List Mutation Trap',
                'Python List References & Shallow Copying',
                'Medium',
                'Determine the final output of the matrix operation where list multiplication creates shallow references instead of independent sublists.',
                'matrix = [[0] * 3] * 3\nmatrix[0][0] = 7\nprint([row[0] for row in matrix])',
                'multiple_choice',
                '[7, 0, 0]',
                '[7, 7, 7]',
                '[[7, 0, 0], [0, 0, 0], [0, 0, 0]]',
                'A TypeError occurs during inner assignment',
                'B',
                'When using `[[0] * 3] * 3`, the outer multiplication creates three references pointing to the exact same inner list in memory. Mutating `matrix[0][0] = 7` affects all three rows because they reference the identical object. To avoid this, use a comprehension: `[[0] * 3 for _ in range(3)]`.',
                50
            ))
