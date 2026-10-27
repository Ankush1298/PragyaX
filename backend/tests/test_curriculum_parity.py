"""
Test Suite for SQLite Curriculum and Schema Synchronization
Verifies:
1. Fresh SQLite database has 7 subjects.
2. Exactly 20 assessment questions exist.
3. Each of four assessment tracks has 5 MCQs.
4. Subject IDs match PostgreSQL migration 0004.
5. Question IDs match PostgreSQL migration 0004.
6. Correct answers match PostgreSQL reference.
7. Inactive subjects remain inactive (only Python is active).
8. Existing SQLite databases receive missing seeds (upgrade scenario).
9. Repeated initialization is idempotent.
10. Existing student records are preserved.
11. Fresh SQLite constraints reject invalid data (CHECK, UNIQUE, FK).
12. Missing indexes are created where safe.
13. Existing backend API endpoints remain functional against SQLite.
"""

import os
import sqlite3
import tempfile

import pytest
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.database.connection import close_db_pool, get_db, init_db
from backend.app.database.repository import Repository
from backend.app.main import app

EXPECTED_SUBJECT_IDS = [
    "subj_python",
    "subj_webdev",
    "subj_datasci",
    "subj_cloud",
    "subj_biology",
    "subj_business",
    "subj_aiml",
]

EXPECTED_ANSWER_KEYS = {
    # Python
    "q_py_1": "B",
    "q_py_2": "C",
    "q_py_3": "C",
    "q_py_4": "B",
    "q_py_5": "A",
    # Biology
    "q_bio_1": "C",
    "q_bio_2": "B",
    "q_bio_3": "B",
    "q_bio_4": "C",
    "q_bio_5": "B",
    # Business
    "q_bus_1": "C",
    "q_bus_2": "B",
    "q_bus_3": "A",
    "q_bus_4": "B",
    "q_bus_5": "B",
    # AI/ML
    "q_aiml_1": "B",
    "q_aiml_2": "B",
    "q_aiml_3": "B",
    "q_aiml_4": "B",
    "q_aiml_5": "B",
}


@pytest.fixture
def isolated_sqlite_env():
    """Sets up an isolated, temporary SQLite database for test execution."""
    fd, temp_db_path = tempfile.mkstemp(suffix="_pragyax_test.db")
    os.close(fd)

    old_db_url = os.environ.get("DATABASE_URL")
    old_db_path = os.environ.get("DATABASE_PATH")

    # Force SQLite mode
    if "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    settings.DATABASE_URL = None
    settings.DATABASE_PATH = temp_db_path
    close_db_pool()

    init_db()

    yield temp_db_path

    # Cleanup
    close_db_pool()
    if old_db_url:
        os.environ["DATABASE_URL"] = old_db_url
        settings.DATABASE_URL = old_db_url
    if old_db_path:
        os.environ["DATABASE_PATH"] = old_db_path
        settings.DATABASE_PATH = old_db_path
    if os.path.exists(temp_db_path):
        try:
            os.remove(temp_db_path)
        except Exception:
            pass


def test_fresh_sqlite_seven_subjects(isolated_sqlite_env):
    """1. Fresh SQLite database has 7 subjects."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, slug, title, is_active FROM subjects ORDER BY id;")
        rows = cursor.fetchall()
        assert len(rows) == 7
        subject_ids = [r["id"] for r in rows]
        for sid in EXPECTED_SUBJECT_IDS:
            assert sid in subject_ids


def test_twenty_assessment_questions_exist(isolated_sqlite_env):
    """2. Exactly 20 assessment questions exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM assessment_questions;")
        row = cursor.fetchone()
        assert row["total"] == 20


def test_four_tracks_have_five_mcqs_each(isolated_sqlite_env):
    """3. Each of four assessment tracks has exactly 5 MCQs sequenced 1..5."""
    tracks = ["subj_python", "subj_biology", "subj_business", "subj_aiml"]
    with get_db() as conn:
        cursor = conn.cursor()
        for track_id in tracks:
            cursor.execute(
                """
                SELECT question_number, id, correct_option
                FROM assessment_questions
                WHERE subject_id = ?
                ORDER BY question_number ASC;
            """,
                (track_id,),
            )
            questions = cursor.fetchall()
            assert len(questions) == 5, (
                f"Track {track_id} does not have exactly 5 questions"
            )
            numbers = [q["question_number"] for q in questions]
            assert numbers == [1, 2, 3, 4, 5], (
                f"Track {track_id} has broken slot sequencing"
            )


def test_subject_ids_match_postgres_migration(isolated_sqlite_env):
    """4. Subject IDs match PostgreSQL migration 0004."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM subjects;")
        db_subject_ids = {r["id"] for r in cursor.fetchall()}
        assert db_subject_ids == set(EXPECTED_SUBJECT_IDS)


def test_question_ids_match_postgres_migration(isolated_sqlite_env):
    """5. Question IDs match PostgreSQL migration 0004."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM assessment_questions;")
        db_question_ids = {r["id"] for r in cursor.fetchall()}
        assert db_question_ids == set(EXPECTED_ANSWER_KEYS.keys())


def test_correct_answers_match_postgres_reference(isolated_sqlite_env):
    """6. Correct answers match PostgreSQL reference keys."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, correct_option FROM assessment_questions;")
        for row in cursor.fetchall():
            qid = row["id"]
            expected_opt = EXPECTED_ANSWER_KEYS[qid]
            assert row["correct_option"] == expected_opt, (
                f"Answer mismatch for {qid}: expected {expected_opt}, got {row['correct_option']}"
            )


def test_inactive_subjects_remain_inactive(isolated_sqlite_env):
    """7. Inactive subjects remain inactive (only Python is active in prototype demo)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, is_active FROM subjects;")
        for r in cursor.fetchall():
            if r["id"] == "subj_python":
                assert r["is_active"] == 1
            else:
                assert r["is_active"] == 0, f"Subject {r['id']} should be inactive"


def test_existing_sqlite_database_upgrade():
    """8. Existing SQLite databases receive missing seeds upon upgrade."""
    fd, legacy_db_path = tempfile.mkstemp(suffix="_legacy_upgrade.db")
    os.close(fd)

    try:
        # Pre-seed with only 4 subjects and 5 python questions (old schema state)
        conn = sqlite3.connect(legacy_db_path)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE subjects (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'code',
                is_active INTEGER NOT NULL DEFAULT 0,
                question_count INTEGER NOT NULL DEFAULT 5,
                difficulty TEXT NOT NULL DEFAULT 'Beginner'
            );
        """)
        cur.execute("""
            CREATE TABLE assessment_questions (
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
                difficulty TEXT NOT NULL DEFAULT 'Intermediate'
            );
        """)
        # Insert old 4 subjects
        cur.executemany(
            "INSERT INTO subjects (id, slug, title, description, icon, is_active, question_count, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
            [
                (
                    "subj_python",
                    "python",
                    "Python",
                    "Python",
                    "python",
                    1,
                    5,
                    "Beginner",
                ),
                ("subj_webdev", "webdev", "Web", "Web", "globe", 0, 5, "Coming Soon"),
                (
                    "subj_datasci",
                    "datasci",
                    "Data",
                    "Data",
                    "database",
                    0,
                    5,
                    "Coming Soon",
                ),
                ("subj_cloud", "cloud", "Cloud", "Cloud", "cloud", 0, 5, "Coming Soon"),
            ],
        )
        # Insert 1 old question
        cur.execute(
            "INSERT INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            (
                "q_py_1",
                "subj_python",
                1,
                "Q1",
                "A",
                "B",
                "C",
                "D",
                "B",
                "exp",
                "topic",
                "easy",
            ),
        )
        conn.commit()
        conn.close()

        # Switch to this legacy DB and run init_db()
        settings.DATABASE_URL = None
        settings.DATABASE_PATH = legacy_db_path
        close_db_pool()
        init_db()

        # Verify upgrade succeeded
        with get_db() as conn2:
            c = conn2.cursor()
            c.execute("SELECT COUNT(*) AS total FROM subjects;")
            assert c.fetchone()["total"] == 7
            c.execute("SELECT COUNT(*) AS total FROM assessment_questions;")
            assert c.fetchone()["total"] == 20
    finally:
        close_db_pool()
        if os.path.exists(legacy_db_path):
            try:
                os.remove(legacy_db_path)
            except Exception:
                pass


def test_repeated_initialization_is_idempotent(isolated_sqlite_env):
    """9. Repeated initialization does not create duplicate records."""
    # Call init_db() multiple times
    init_db()
    init_db()
    init_db()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM subjects;")
        assert cursor.fetchone()["total"] == 7
        cursor.execute("SELECT COUNT(*) AS total FROM assessment_questions;")
        assert cursor.fetchone()["total"] == 20
        cursor.execute("SELECT COUNT(*) AS total FROM daily_challenges;")
        assert cursor.fetchone()["total"] == 1


def test_existing_student_records_preserved(isolated_sqlite_env):
    """10. Existing student records remain intact after re-initialization."""
    user = Repository.create_user(
        "Test Student", "student@pragyax.test", "dummy_hash_123", "dummy_salt_123"
    )
    user_id = user["id"]

    # Re-run initialization
    init_db()

    # User and preferences must still exist
    fetched = Repository.get_user_by_id(user_id)
    assert fetched is not None
    assert fetched["email"] == "student@pragyax.test"

    pref = Repository.get_user_selected_subject(user_id)
    assert pref is not None
    assert pref["id"] == "subj_python"


def test_fresh_sqlite_constraints_reject_invalid_data(isolated_sqlite_env):
    """11. Fresh SQLite constraints reject invalid data (domain CHECK, UNIQUE, FK)."""
    # Create test user for foreign key referencing before opening test connection
    user = Repository.create_user(
        "Chat User", "chatuser@pragyax.test", "dummy_hash_456", "dummy_salt_456"
    )

    with get_db() as conn:
        cursor = conn.cursor()

        # Check 1: Foreign key constraint on user_preferences.selected_subject_id
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute("""
                INSERT INTO user_preferences (user_id, selected_subject_id)
                VALUES ('nonexistent_user', 'subj_nonexistent_subject');
            """)

        # Check 2: Check constraint on assessment_questions.correct_option
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute("""
                INSERT INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic)
                VALUES ('q_invalid_opt', 'subj_python', 99, 'Text', 'A', 'B', 'C', 'D', 'Z', 'Exp', 'Topic');
            """)

        # Check 3: Unique constraint on (subject_id, question_number)
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute("""
                INSERT INTO assessment_questions (id, subject_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic)
                VALUES ('q_dup_slot', 'subj_python', 1, 'Dup Q1', 'A', 'B', 'C', 'D', 'A', 'Exp', 'Topic');
            """)

        # Check 4: Check constraint on chat_messages.role
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute(
                """
                INSERT INTO chat_messages (id, user_id, subject, role, content)
                VALUES ('msg_invalid_role', ?, 'Python', 'superadmin', 'Hello');
            """,
                (user["id"],),
            )

        # Check 5: Check constraint on daily_challenges.correct_option
        with pytest.raises(sqlite3.IntegrityError):
            cursor.execute("""
                INSERT INTO daily_challenges (id, title, topic, description, code_snippet, option_a, option_b, option_c, option_d, correct_option, explanation)
                VALUES ('chal_invalid_key', 'T', 'Top', 'Desc', 'Snippet', 'A', 'B', 'C', 'D', 'X', 'Exp');
            """)


def test_missing_indexes_created(isolated_sqlite_env):
    """12. Missing indexes are created where safe."""
    expected_indexes = [
        "idx_assessment_attempts_user_created",
        "idx_chat_messages_user_created",
        "idx_assessment_questions_subject",
        "idx_user_badges_user_awarded",
        "idx_active_sessions_user_id",
    ]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type = 'index';")
        db_indexes = {row["name"] for row in cursor.fetchall()}
        for idx in expected_indexes:
            assert idx in db_indexes, f"Index {idx} was not found in sqlite_master"


def test_existing_backend_api_functional(isolated_sqlite_env):
    """13. Existing backend API endpoints remain functional with fresh SQLite schema."""
    with TestClient(app) as client:
        # Health check
        h_res = client.get("/api/health")
        assert h_res.status_code == 200
        assert "SQLite" in h_res.json()["database"]

        # Subjects list has 7 subjects
        reg_res = client.post(
            "/api/auth/register",
            json={
                "name": "Integration Student",
                "email": "intstudent@pragyax.test",
                "password": "validPassword123!",
            },
        )
        assert reg_res.status_code == 201
        token = reg_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        subj_res = client.get("/api/subjects", headers=headers)
        assert subj_res.status_code == 200
        subjects = subj_res.json()["subjects"]
        assert len(subjects) == 7

        # Selecting Coming Soon subject returns 400
        sel_res = client.post(
            "/api/subjects/select", json={"subject_id": "subj_biology"}, headers=headers
        )
        assert sel_res.status_code == 400
        assert "Coming Soon" in sel_res.json()["detail"]

        # Questions for Python loads exactly 5 MCQs
        q_res = client.get(
            "/api/assessments/questions?subject_id=subj_python", headers=headers
        )
        assert q_res.status_code == 200
        questions = q_res.json()
        assert len(questions) == 5
