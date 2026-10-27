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

        # Seed initial subjects (Python, Math, Physics, Chemistry, Biology)
        cursor.executemany("""
            INSERT OR REPLACE INTO subjects (id, slug, title, description, icon, is_active, question_count, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, [
            ('subj_python', 'python', 'Python Programming', 'Learn programming concepts, write code, and solve practical problems.', 'code', 1, 5, 'Beginner to Intermediate'),
            ('subj_math', 'math', 'Mathematics', 'Explore mathematical concepts, formulas, problem-solving, and numerical reasoning.', 'calculator', 1, 5, 'Beginner to Advanced'),
            ('subj_physics', 'physics', 'Physics', 'Understand physical laws, mechanics, electricity, waves, and other physics concepts.', 'atom', 1, 5, 'Intermediate'),
            ('subj_chemistry', 'chemistry', 'Chemistry', 'Study chemical reactions, atomic structure, bonding, and chemical principles.', 'flask-conical', 1, 5, 'Intermediate'),
            ('subj_biology', 'biology', 'Biology', 'Explore cells, genetics, human biology, ecology, and living systems.', 'dna', 1, 5, 'Beginner to Intermediate'),
            ('subj_webdev', 'webdev', 'Modern Full-Stack Web', 'React, TypeScript, state machines, and modern client-server architecture.', 'globe', 0, 5, 'Coming Soon'),
            ('subj_datasci', 'datasci', 'Data Science & ML', 'NumPy, Pandas, model evaluation metrics, and exploratory data analysis.', 'database', 0, 5, 'Coming Soon'),
            ('subj_cloud', 'cloud', 'Cloud & DevOps Architecture', 'Containerization, CI/CD pipelines, and scalable cloud services.', 'cloud', 0, 5, 'Coming Soon')
        ])

        # Seed comprehensive 5-question diagnostic assessments for each active subject
        all_questions = [
            # 1. PYTHON PROGRAMMING
            (
                'q_py_1', 'subj_python', 1,
                'Consider the function definition:\ndef append_item(val, container=[]):\n    container.append(val)\n    return container\n\nWhat is returned after calling append_item(1) followed by append_item(2)?',
                'append_item(2) returns [2]',
                'append_item(2) returns [1, 2]',
                'A TypeError is raised because default arguments must be immutable',
                'append_item(2) returns [[1], [2]]',
                'B',
                'In Python, default parameter expressions are evaluated once when the function is defined, NOT each time it is invoked. Because lists are mutable, subsequent calls share the exact same default list instance unless overridden.',
                'Default Parameter Evaluation & Mutability', 'Intermediate'
            ),
            (
                'q_py_2', 'subj_python', 2,
                'Given data = [10, 20, 30, 40, 50], what does the slicing expression data[1:4:-1] produce?',
                '[40, 30, 20]',
                '[40, 30]',
                '[] (an empty list)',
                '[20, 30, 40]',
                'C',
                'The slice notation is [start:stop:step]. When step is -1, Python decrements from start down towards stop. Since start (1) is less than stop (4) and step is negative, the loop cannot proceed backwards, returning an empty list []. To slice in reverse from index 3 down to 1, one would write data[3:0:-1].',
                'Sequence Slicing & Negative Steps', 'Intermediate'
            ),
            (
                'q_py_3', 'subj_python', 3,
                'Why does attempting lookup = { [1, 2]: "coords" } raise a TypeError: unhashable type: "list", whereas lookup = { (1, 2): "coords" } succeeds?',
                'Dictionaries can only store single primitive numbers or strings as keys',
                'Tuples have lower memory overhead than lists',
                'Dictionary keys must be hashable and immutable so their hash bucket remains invariant throughout execution',
                'Python syntax requires commas to be enclosed in parentheses',
                'C',
                'Python dictionaries use hash tables for O(1) key lookups. Keys must implement __hash__() and remain invariant. Since lists are mutable (their contents and identity can change), they are unhashable. Tuples containing only immutable elements are hashable.',
                'Hash Tables, Mutability & Dictionary Keys', 'Beginner to Intermediate'
            ),
            (
                'q_py_4', 'subj_python', 4,
                'What is the fundamental operational difference between nums_sq = [x*x for x in range(1000000)] and gen_sq = (x*x for x in range(1000000))?',
                'The list comprehension executes faster in all memory scenarios',
                'The generator expression produces a generator object that evaluates items lazily on demand without allocating memory for 1,000,000 items upfront',
                'Generators can only produce integer values, whereas list comprehensions accept any data type',
                'There is no difference; parentheses in comprehensions are just alternative syntax',
                'B',
                'Square brackets [...] evaluate the list comprehension immediately and allocate memory for the entire million-element list in RAM. Parentheses (...) create a generator expression which uses lazy evaluation, computing values one by one on demand with O(1) memory overhead.',
                'List Comprehensions vs Generator Expressions', 'Intermediate'
            ),
            (
                'q_py_5', 'subj_python', 5,
                'In Python variable scope resolution (the LEGB rule), which order of namespaces does the interpreter search when looking up an identifier?',
                'Local -> Enclosing -> Global -> Built-in',
                'Global -> Local -> Enclosing -> Built-in',
                'Built-in -> Global -> Enclosing -> Local',
                'Local -> Global -> Enclosing -> Built-in',
                'A',
                'Python resolves names using the LEGB rule: 1) Local (inside the current function), 2) Enclosing (in any enclosing nested functions/closures), 3) Global (at the module level), and 4) Built-in (standard Python builtins like print, len, range).',
                'LEGB Variable Scope & Closures', 'Intermediate'
            ),

            # 2. MATHEMATICS
            (
                'q_math_1', 'subj_math', 1,
                'Solve for x in the exponential equation: 2^(2x + 1) = 32.',
                'x = 1',
                'x = 2',
                'x = 3',
                'x = 4',
                'B',
                'Express 32 as a power of 2: 32 = 2^5. Equating exponents: 2x + 1 = 5, which simplifies to 2x = 4, giving x = 2.',
                'Algebra', 'Beginner'
            ),
            (
                'q_math_2', 'subj_math', 2,
                'What is the first derivative of f(x) = x * ln(x) with respect to x for all x > 0?',
                '1 / x',
                'ln(x)',
                '1 + ln(x)',
                'x + ln(x)',
                'C',
                'By the product rule d/dx[u*v] = u\'*v + u*v\'. Here u = x (u\' = 1) and v = ln(x) (v\' = 1/x). Thus f\'(x) = 1*ln(x) + x*(1/x) = ln(x) + 1.',
                'Calculus', 'Intermediate'
            ),
            (
                'q_math_3', 'subj_math', 3,
                'If sin(θ) = 3/5 and θ is in the first quadrant (0 < θ < π/2), what is the exact value of tan(2θ)?',
                '24 / 7',
                '7 / 24',
                '4 / 3',
                '24 / 25',
                'A',
                'In the first quadrant, cos(θ) = √(1 - 9/25) = 4/5. Thus tan(θ) = (3/5)/(4/5) = 3/4. Using the double-angle formula: tan(2θ) = 2*tan(θ) / (1 - tan²(θ)) = 2*(3/4) / (1 - 9/16) = (3/2) / (7/16) = 24/7.',
                'Trigonometry', 'Intermediate'
            ),
            (
                'q_math_4', 'subj_math', 4,
                'Given the 2×2 matrix M = [[2, 4], [1, 5]], what is the determinant of M?',
                '6',
                '10',
                '14',
                '-6',
                'A',
                'The determinant of a 2x2 matrix [[a, b], [c, d]] is given by ad - bc. For M, det(M) = (2 * 5) - (4 * 1) = 10 - 4 = 6.',
                'Linear Algebra', 'Intermediate'
            ),
            (
                'q_math_5', 'subj_math', 5,
                'Two standard fair six-sided dice are rolled simultaneously. What is the theoretical probability that the sum of the dice equals 8?',
                '1 / 6',
                '5 / 36',
                '1 / 9',
                '7 / 36',
                'B',
                'There are 6 × 6 = 36 total equiprobable outcomes. The pairs summing to 8 are (2,6), (3,5), (4,4), (5,3), and (6,2), which totals 5 favorable outcomes. Hence P(sum = 8) = 5/36.',
                'Probability & Statistics', 'Intermediate'
            ),

            # 3. PHYSICS
            (
                'q_phys_1', 'subj_physics', 1,
                'A vehicle accelerates uniformly from rest to a velocity of 20 m/s along a straight track over a distance of 100 meters. What is the magnitude of its acceleration?',
                '1.0 m/s²',
                '2.0 m/s²',
                '4.0 m/s²',
                '5.0 m/s²',
                'B',
                'Using the kinematic equation v² = u² + 2as with u = 0 m/s, v = 20 m/s, and s = 100 m: (20)² = 0 + 2 * a * 100 => 400 = 200a => a = 2.0 m/s².',
                'Mechanics & Kinematics', 'Beginner'
            ),
            (
                'q_phys_2', 'subj_physics', 2,
                'Three electrical resistors with resistances of 6 Ω, 3 Ω, and 2 Ω are connected in parallel across a circuit. What is their equivalent total resistance?',
                '1.0 Ω',
                '11.0 Ω',
                '2.0 Ω',
                '0.5 Ω',
                'A',
                'For parallel resistors: 1/R_eq = 1/R1 + 1/R2 + 1/R3 = 1/6 + 1/3 + 1/2 = 1/6 + 2/6 + 3/6 = 6/6 = 1.0 Ω⁻¹. Inverting gives R_eq = 1.0 Ω.',
                'Electricity & Magnetism', 'Intermediate'
            ),
            (
                'q_phys_3', 'subj_physics', 3,
                'A simple pendulum bob of mass m is released from rest at height h above its equilibrium position. Neglecting friction and air resistance, what is the bob\'s speed at the lowest point?',
                'gh',
                '√(2gh)',
                '2gh',
                '√(gh)',
                'B',
                'By the law of conservation of mechanical energy, potential energy at release converts fully into kinetic energy at lowest point: mgh = (1/2)mv² => v² = 2gh => v = √(2gh).',
                'Work, Energy & Power', 'Intermediate'
            ),
            (
                'q_phys_4', 'subj_physics', 4,
                'An ideal gas undergoes a quasi-static isothermal expansion at constant temperature T. Which statement is physically TRUE regarding this thermodynamic process?',
                'The internal energy increases proportionally to the expanding volume',
                'No heat is exchanged between the system and its surroundings',
                'The change in internal energy ΔU is zero, so net heat absorbed Q equals work done W',
                'The pressure of the gas remains strictly constant throughout the expansion',
                'C',
                'For an ideal gas, internal energy is a function of temperature alone (ΔU = n*Cv*ΔT). In an isothermal process ΔT = 0, so ΔU = 0. According to the First Law of Thermodynamics (ΔU = Q - W), Q = W: all heat absorbed is directly converted into boundary work.',
                'Thermodynamics', 'Intermediate'
            ),
            (
                'q_phys_5', 'subj_physics', 5,
                'When a mechanical sound wave propagates from air into liquid water, what happens to its frequency, propagation speed, and wavelength?',
                'Frequency increases, wavelength decreases, speed increases',
                'Frequency remains constant, speed increases, wavelength increases',
                'Frequency decreases, wavelength remains constant, speed decreases',
                'Frequency remains constant, speed decreases, wavelength decreases',
                'B',
                'Frequency is dictated by the wave source and remains invariant when transitioning across different media. Because the bulk modulus of water makes sound travel ~4.3x faster in water (~1480 m/s) than in air (~343 m/s), the wave equation v = f * λ requires the wavelength λ to increase proportionally.',
                'Waves & Oscillations', 'Intermediate'
            ),

            # 4. CHEMISTRY
            (
                'q_chem_1', 'subj_chemistry', 1,
                'What is the ground-state electron configuration of a neutral Chromium atom (atomic number Z = 24)?',
                '[Ar] 4s² 3d⁴',
                '[Ar] 4s¹ 3d⁵',
                '[Ar] 4s⁰ 3d⁶',
                '[Ar] 3d⁶',
                'B',
                'Chromium is an exception to the standard Aufbau ordering due to exchange energy stabilization associated with half-filled d subshells. An electron shifts from 4s to 3d, yielding [Ar] 4s¹ 3d⁵ rather than [Ar] 4s² 3d⁴.',
                'Atomic Structure & Orbitals', 'Intermediate'
            ),
            (
                'q_chem_2', 'subj_chemistry', 2,
                'What is the molecular geometry and hybridization of the central sulfur atom in sulfur hexafluoride (SF₆)?',
                'Octahedral geometry with sp³d² hybridization',
                'Trigonal bipyramidal with sp³d hybridization',
                'Tetrahedral geometry with sp³ hybridization',
                'Square planar geometry with dsp² hybridization',
                'A',
                'Sulfur in SF₆ has 6 single covalent bonds and 0 lone pairs (steric number = 6). According to VSEPR theory, 6 electron domains minimize repulsion in an octahedral geometry with sp³d² hybrid orbitals.',
                'Chemical Bonding & Molecular Geometry', 'Intermediate'
            ),
            (
                'q_chem_3', 'subj_chemistry', 3,
                'For the exothermic synthesis of ammonia: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = -92.4 kJ/mol), which set of conditions maximizes the equilibrium yield of NH₃?',
                'High temperature and low pressure',
                'High temperature and high pressure',
                'Low temperature and high pressure',
                'Low temperature and low pressure',
                'C',
                'By Le Chatelier\'s principle, decreasing temperature shifts exothermic reactions forward. Increasing pressure shifts equilibrium toward the side with fewer gas moles (4 moles reactants -> 2 moles products). Thus, low temperature and high pressure maximize yield.',
                'Chemical Equilibrium & Le Chatelier', 'Intermediate'
            ),
            (
                'q_chem_4', 'subj_chemistry', 4,
                'What is the pH of a 0.005 M aqueous solution of barium hydroxide, Ba(OH)₂, at 25°C assuming complete ionic dissociation?',
                '2.0',
                '11.7',
                '12.0',
                '12.3',
                'C',
                'Ba(OH)₂ completely dissociates: Ba(OH)₂ -> Ba²⁺ + 2OH⁻. Thus [OH⁻] = 2 × 0.005 M = 0.010 M = 10⁻² M. pOH = -log₁₀(10⁻²) = 2.0. At 25°C, pH = 14.0 - pOH = 14.0 - 2.0 = 12.0.',
                'Acids, Bases & pH Calculations', 'Intermediate'
            ),
            (
                'q_chem_5', 'subj_chemistry', 5,
                'A chemical process exhibits a negative enthalpy change (ΔH° < 0) and a positive entropy change (ΔS° > 0). According to the Gibbs free energy equation (ΔG° = ΔH° - TΔS°), the reaction is:',
                'Spontaneous at all absolute temperatures',
                'Spontaneous only at low temperatures',
                'Spontaneous only at high temperatures',
                'Non-spontaneous at all temperatures',
                'A',
                'In ΔG° = ΔH° - TΔS°, with ΔH° < 0 and ΔS° > 0, the term -TΔS° is negative for any absolute temperature T > 0 K. Since both components are negative, ΔG° is always negative, guaranteeing thermodynamic spontaneity at all temperatures.',
                'Chemical Thermodynamics', 'Intermediate'
            ),

            # 5. BIOLOGY
            (
                'q_bio_1', 'subj_biology', 1,
                'Which cellular organelle is primarily responsible for post-translational chemical modification, sorting, and packaging of proteins into membrane-bound vesicles?',
                'Lysosome',
                'Golgi apparatus',
                'Smooth endoplasmic reticulum',
                'Nucleolus',
                'B',
                'The Golgi apparatus receives newly translated proteins from the rough ER, carries out modifications such as glycosylation and phosphorylation, and targets them to lysosomes, the secretory pathway, or the plasma membrane.',
                'Cell Biology & Organelles', 'Beginner'
            ),
            (
                'q_bio_2', 'subj_biology', 2,
                'During semi-conservative DNA replication in cells, which enzyme is responsible for unwinding the double helix by breaking hydrogen bonds at the replication fork?',
                'DNA Polymerase III',
                'DNA Ligase',
                'DNA Helicase',
                'Topoisomerase',
                'C',
                'DNA Helicase unwinds the double-stranded DNA template by disrupting hydrogen bonds between complementary base pairs. Topoisomerase relieves upstream torsional strain, while Ligase seals phosphodiester nicks in the lagging strand.',
                'Genetics & Molecular Biology', 'Intermediate'
            ),
            (
                'q_bio_3', 'subj_biology', 3,
                'In the mammalian nephron, in which segment does the vast majority (~65–70%) of obligatory reabsorption of water, sodium, and 100% of filtered glucose occur?',
                'Distal convoluted tubule',
                'Proximal convoluted tubule',
                'Loop of Henle descending limb',
                'Cortical collecting duct',
                'B',
                'The proximal convoluted tubule (PCT) has extensive microvilli forming a dense brush border with abundant mitochondria. It reabsorbs ~67% of water and salt, and virtually all filtered glucose and amino acids via sodium-coupled secondary active transport.',
                'Human Physiology & Renal System', 'Intermediate'
            ),
            (
                'q_bio_4', 'subj_biology', 4,
                'During the light-dependent reactions of oxygenic photosynthesis, what chemical species acts as the initial electron donor that reduces the photo-oxidized P680 reaction center in Photosystem II?',
                'Carbon dioxide (CO₂)',
                'Water (H₂O)',
                'NADPH',
                'D-Glucose',
                'B',
                'Photolysis of water (2H₂O -> O₂ + 4H⁺ + 4e⁻) by the manganese-containing oxygen-evolving complex of Photosystem II provides replacement electrons to P680+, with molecular oxygen released as a vital byproduct.',
                'Plant Biology & Photosynthesis', 'Intermediate'
            ),
            (
                'q_bio_5', 'subj_biology', 5,
                'Which evolutionary mechanism describes unpredictable, stochastic fluctuations in allele frequencies within a gene pool caused entirely by random sampling chance events?',
                'Disruptive selection',
                'Genetic drift',
                'Gene flow',
                'Adaptive radiation',
                'B',
                'Genetic drift is evolutionary change resulting from random sampling error across finite generations. It operates independently of fitness or natural selection, and has dramatic effects in small populations through founder effects or bottlenecks.',
                'Evolution & Ecology', 'Intermediate'
            )
        ]

        cursor.executemany("""
            INSERT OR REPLACE INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, all_questions)

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

        # Seed default demo students if missing
        cursor.execute("SELECT COUNT(*) AS cnt FROM users WHERE email = 'student@college.edu';")
        if cursor.fetchone()["cnt"] == 0:
            from ..services.auth_service import hash_password, generate_salt
            salt = generate_salt()
            pwd_hash = hash_password("demopassword123", salt)
            cursor.execute("""
                INSERT OR IGNORE INTO users (id, name, email, password_hash, salt)
                VALUES ('usr_demo_student', 'Asha Sharma', 'student@college.edu', ?, ?);
            """, (pwd_hash, salt))
            cursor.execute("""
                INSERT OR IGNORE INTO user_preferences (user_id, selected_subject_id)
                VALUES ('usr_demo_student', 'subj_python');
            """)
