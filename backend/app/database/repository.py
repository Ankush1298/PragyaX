"""
Data Access Repository Pattern
Abstracts persistence operations so SQLite can be swapped for Supabase PostgreSQL by Nagin.
Owned by: Nagin (Supabase Database Architecture) & Arsh (Backend)
"""

import json
import uuid
from typing import List, Dict, Any, Optional
from .connection import get_db
from ..config import settings


class Repository:
    """Central Data Access Object for PragyaX."""

    # ==========================
    # 1. USER ACCOUNTS & SESSIONS
    # ==========================

    @staticmethod
    def create_user(name: str, email: str, password_hash: str, salt: str) -> Dict[str, Any]:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (id, name, email, password_hash, salt)
                VALUES (?, ?, ?, ?, ?);
            """, (user_id, name, email.lower().strip(), password_hash, salt))

            # No preference row yet: Python is used as the default until the learner explicitly selects a subject.
        return Repository.get_user_by_id(user_id)

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?;", (email.lower().strip(),))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = ?;", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def create_session(user_id: str, token: str):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO active_sessions (token, user_id)
                VALUES (?, ?);
            """, (token, user_id))

    @staticmethod
    def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.created_at
                FROM active_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ?
                  AND s.created_at >= datetime('now', ?);
            """, (token, f"-{settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes"))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def delete_session(token: str):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM active_sessions WHERE token = ?;", (token,))

    # ==========================
    # 2. SUBJECTS & PREFERENCES
    # ==========================

    @staticmethod
    def get_all_subjects() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM subjects ORDER BY is_active DESC, title ASC;")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_subject_by_id(subject_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM subjects WHERE id = ? OR slug = ?;", (subject_id, subject_id))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_user_selected_subject(user_id: str) -> Dict[str, Any]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT s.* FROM user_preferences p
                JOIN subjects s ON p.selected_subject_id = s.id
                WHERE p.user_id = ?;
            """, (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            # Default to Python if not explicitly set
            cursor.execute("SELECT * FROM subjects WHERE id = 'subj_python';")
            return dict(cursor.fetchone())

    @staticmethod
    def set_user_selected_subject(user_id: str, subject_id: str) -> Dict[str, Any]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_preferences (user_id, selected_subject_id, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    selected_subject_id = excluded.selected_subject_id,
                    updated_at = CURRENT_TIMESTAMP;
            """, (user_id, subject_id))
        return Repository.get_user_selected_subject(user_id)

    # ==========================
    # 3. LEARNING CHAT
    # ==========================

    @staticmethod
    def save_chat_message(user_id: str, subject: str, role: str, content: str, suggested_followups: List[str] = None) -> Dict[str, Any]:
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        followups_json = json.dumps(suggested_followups or [])
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_messages (id, user_id, subject, role, content, suggested_followups)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (msg_id, user_id, subject, role, content, followups_json))
        return {
            "id": msg_id,
            "user_id": user_id,
            "subject": subject,
            "role": role,
            "content": content,
            "suggested_followups": suggested_followups or []
        }

    @staticmethod
    def get_chat_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM (
                    SELECT rowid AS seq, id, user_id, subject, role, content, suggested_followups, created_at
                    FROM chat_messages
                    WHERE user_id = ?
                    ORDER BY rowid DESC
                    LIMIT ?
                ) ORDER BY seq ASC;
            """, (user_id, limit))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                item = dict(r)
                item["suggested_followups"] = json.loads(item["suggested_followups"]) if item.get("suggested_followups") else []
                result.append(item)
            return result

    # ==========================
    # 4. ASSESSMENTS
    # ==========================

    @staticmethod
    def get_assessment_questions(subject_id: str = "subj_python") -> List[Dict[str, Any]]:
        """Returns questions for an assessment. (Excludes correct answers for public loading)."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, subject_id, question_number, question_text,
                       option_a, option_b, option_c, option_d, topic, difficulty
                FROM assessment_questions
                WHERE subject_id = ? OR subject_id IN (SELECT id FROM subjects WHERE slug = ?)
                ORDER BY question_number ASC;
            """, (subject_id, subject_id))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_raw_assessment_questions_with_answers(subject_id: str = "subj_python") -> List[Dict[str, Any]]:
        """Internal backend-only method to load questions with correct_option for evaluation."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, subject_id, question_number, question_text,
                       option_a, option_b, option_c, option_d,
                       correct_option, explanation, topic, difficulty
                FROM assessment_questions
                WHERE subject_id = ? OR subject_id IN (SELECT id FROM subjects WHERE slug = ?)
                ORDER BY question_number ASC;
            """, (subject_id, subject_id))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def save_assessment_attempt(
        user_id: str,
        subject_id: str,
        score: int,
        total: int,
        percentage: float,
        proficiency_level: str,
        summary_feedback: str,
        recommended_topics: List[str],
        user_answers: Dict[str, str],
        breakdown: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        attempt_id = f"atm_{uuid.uuid4().hex[:12]}"
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO assessment_attempts (
                    id, user_id, subject_id, score, total, percentage,
                    proficiency_level, summary_feedback, recommended_topics,
                    user_answers, breakdown
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                attempt_id,
                user_id,
                subject_id,
                score,
                total,
                percentage,
                proficiency_level,
                summary_feedback,
                json.dumps(recommended_topics),
                json.dumps(user_answers),
                json.dumps(breakdown)
            ))

            # If score is >= 4, award high-scorer badge if not yet given
            if score >= 4:
                badge_meta = {
                    "subj_python": ("py_master", "Python Virtuoso", "Scored 80%+ on the Python Assessment"),
                    "subj_math": ("math_master", "Mathematics Virtuoso", "Scored 80%+ on the Mathematics Assessment"),
                    "subj_physics": ("physics_master", "Physics Virtuoso", "Scored 80%+ on the Physics Assessment"),
                    "subj_chemistry": ("chem_master", "Chemistry Virtuoso", "Scored 80%+ on the Chemistry Assessment"),
                    "subj_biology": ("bio_master", "Biology Virtuoso", "Scored 80%+ on the Biology Assessment"),
                }
                b_key, b_title, b_desc = badge_meta.get(
                    subject_id,
                    (f"{subject_id}_master", "Subject Virtuoso", "Scored 80%+ on assessment")
                )
                cursor.execute("""
                    INSERT OR IGNORE INTO user_badges (id, user_id, badge_key, title, description, icon)
                    VALUES (?, ?, ?, ?, ?, 'award');
                """, (f"bdg_{uuid.uuid4().hex[:8]}", user_id, b_key, b_title, b_desc))

        return Repository.get_assessment_attempt_by_id(attempt_id, user_id)

    @staticmethod
    def get_assessment_attempt_by_id(attempt_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Prevents unauthorized users from accessing another user's attempt records."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, s.title AS subject_title
                FROM assessment_attempts a
                JOIN subjects s ON a.subject_id = s.id
                WHERE a.id = ? AND a.user_id = ?;
            """, (attempt_id, user_id))
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            item["recommended_topics"] = json.loads(item["recommended_topics"])
            item["user_answers"] = json.loads(item["user_answers"])
            item["breakdown"] = json.loads(item["breakdown"])
            return item

    @staticmethod
    def get_user_assessment_attempts(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.id, a.user_id, a.subject_id, s.title AS subject_title,
                       a.score, a.total, a.percentage, a.proficiency_level,
                       a.summary_feedback, a.recommended_topics, a.created_at
                FROM assessment_attempts a
                JOIN subjects s ON a.subject_id = s.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC, a.rowid DESC
                LIMIT ?;
            """, (user_id, limit))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["recommended_topics"] = json.loads(item["recommended_topics"]) if item.get("recommended_topics") else []
                results.append(item)
            return results

    # ==========================
    # 5. DASHBOARD METRICS (REAL DATA)
    # ==========================

    @staticmethod
    def get_user_dashboard_metrics(user_id: str) -> Dict[str, Any]:
        user = Repository.get_user_by_id(user_id)
        selected_subject = Repository.get_user_selected_subject(user_id)
        attempts = Repository.get_user_assessment_attempts(user_id, limit=5)
        badges = Repository.get_user_badges(user_id)
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) as total_attempts,
                       AVG(percentage) as avg_score,
                       MAX(score) as max_score
                FROM assessment_attempts
                WHERE user_id = ?;
            """, (user_id,))
            stats = dict(cursor.fetchone())
            cursor.execute("SELECT MAX(percentage) AS best FROM assessment_attempts WHERE user_id = ?;", (user_id,))
            best_percentage = cursor.fetchone()["best"]
            cursor.execute("SELECT COUNT(*) AS n FROM chat_messages WHERE user_id = ? AND role = 'user';", (user_id,))
            questions_asked = cursor.fetchone()["n"]
            cursor.execute("SELECT COALESCE(SUM(points_awarded), 0) AS pts, COUNT(*) AS n FROM user_challenge_submissions WHERE user_id = ?;", (user_id,))
            challenge_row = cursor.fetchone()
            cursor.execute("SELECT 1 FROM user_preferences WHERE user_id = ?;", (user_id,))
            has_selected_subject = cursor.fetchone() is not None

        total_attempts = stats["total_attempts"] or 0
        avg_score = round(stats["avg_score"], 1) if stats["avg_score"] is not None else 0.0
        # Filter attempts for the selected subject if available, or fall back to overall latest
        subject_attempts = [a for a in attempts if a.get("subject_id") == selected_subject["id"]]
        latest_attempt = subject_attempts[0] if subject_attempts else (attempts[0] if attempts else None)

        # Recommendations come from the latest saved attempt for this subject; before any attempt we show subject starter topics.
        if latest_attempt:
            recommended_topics = latest_attempt.get("recommended_topics", [])
            recommendations_source = "latest_assessment"
        else:
            slug = selected_subject.get("slug", "python")
            starters = {
                "python": ["Python variables, types and mutability", "Lists, tuples, dictionaries and slicing", "Functions and variable scope (LEGB)"],
                "math": ["Algebraic equations & exponents", "Derivatives & calculus foundations", "Trigonometric ratios & identities"],
                "physics": ["Kinematics & Newton's laws of motion", "Circuit laws & parallel resistance", "Conservation of mechanical energy"],
                "chemistry": ["Electron configurations & atomic orbitals", "VSEPR theory & molecular geometry", "Le Chatelier's equilibrium principle"],
                "biology": ["Cell organelles & protein trafficking", "DNA replication & key enzymes", "Nephron physiology & reabsorption"]
            }
            recommended_topics = starters.get(slug, [f"Core foundations of {selected_subject.get('title', 'the subject')}", "Diagnostic practice questions", "Core problem solving"])
            recommendations_source = "starter"

        return {
            "user": user,
            "selected_subject": selected_subject,
            "has_selected_subject": has_selected_subject,
            "metrics": {
                "total_assessments_completed": total_attempts,
                "latest_score": latest_attempt.get("score") if latest_attempt else None,
                "latest_total": latest_attempt.get("total") if latest_attempt else 5,
                "latest_percentage": latest_attempt.get("percentage") if latest_attempt else None,
                "latest_proficiency": latest_attempt.get("proficiency_level") if latest_attempt else "Not Assessed",
                "average_percentage": avg_score,
                "highest_score": stats["max_score"] or 0,
                "best_percentage": best_percentage or 0.0,
                "chat_questions_asked": questions_asked,
                "challenges_attempted": challenge_row["n"],
                "total_points": challenge_row["pts"],
            },
            "recommended_next_topics": recommended_topics,
            "recommendations_source": recommendations_source,
            "recent_attempts": attempts,
            "badges": badges
        }

    # ==========================
    # 6. DAILY CHALLENGES & BADGES (ANKUSH'S FEATURE)
    # ==========================

    @staticmethod
    def get_daily_challenge(user_id: str) -> Dict[str, Any]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM daily_challenges LIMIT 1;")
            chal_row = cursor.fetchone()
            if not chal_row:
                return {}
            chal = dict(chal_row)

            # Check if user has already solved it
            cursor.execute("""
                SELECT * FROM user_challenge_submissions
                WHERE user_id = ? AND challenge_id = ?;
            """, (user_id, chal["id"]))
            sub_row = cursor.fetchone()
            chal["has_completed"] = bool(sub_row)
            chal["user_submission"] = dict(sub_row) if sub_row else None
            # Do not leak correct_option to client if incomplete
            if not chal["has_completed"]:
                chal["correct_option"] = None
                chal["explanation"] = None
            return chal

    @staticmethod
    def submit_daily_challenge(user_id: str, challenge_id: str, selected_option: str) -> Dict[str, Any]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM daily_challenges WHERE id = ?;", (challenge_id,))
            chal = cursor.fetchone()
            if not chal:
                return {"error": "Challenge not found"}

            # Check for existing submission
            cursor.execute("""
                SELECT * FROM user_challenge_submissions
                WHERE user_id = ? AND challenge_id = ?;
            """, (user_id, challenge_id))
            if cursor.fetchone():
                return {"error": "Challenge already completed by this user today"}

            is_correct = (selected_option.strip().upper() == chal["correct_option"].upper())
            points = chal["points"] if is_correct else 0
            sub_id = f"csub_{uuid.uuid4().hex[:10]}"

            cursor.execute("""
                INSERT INTO user_challenge_submissions (
                    id, user_id, challenge_id, submitted_answer, is_correct, points_awarded
                )
                VALUES (?, ?, ?, ?, ?, ?);
            """, (sub_id, user_id, challenge_id, selected_option.strip().upper(), 1 if is_correct else 0, points))

            # If correct, award daily solver badge
            if is_correct:
                cursor.execute("""
                    INSERT OR IGNORE INTO user_badges (id, user_id, badge_key, title, description, icon)
                    VALUES (?, ?, 'daily_striker', 'Daily Code Breaker', 'Solved today''s Python code snippet challenge', 'zap');
                """, (f"bdg_{uuid.uuid4().hex[:8]}", user_id))

            return {
                "challenge_id": challenge_id,
                "is_correct": is_correct,
                "points_awarded": points,
                "correct_option": chal["correct_option"],
                "explanation": chal["explanation"]
            }

    @staticmethod
    def get_user_badges(user_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, badge_key, title, description, icon, awarded_at
                FROM user_badges
                WHERE user_id = ?
                ORDER BY awarded_at DESC;
            """, (user_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
