"""
PragyaX Competition, Battle, Gamification, Referral & Certificate Repository
Owned by: Ankush (Gamification & Competition Module Owner)
Works seamlessly with PragyaX's Dual Connection Manager (SQLite & PostgreSQL).
"""

import json
import uuid
import hashlib
from datetime import datetime, date, timezone
from typing import List, Dict, Any, Optional
from .connection import get_db


def init_competition_tables():
    """Ensures all competition, battle, ledger, referral and certificate tables exist."""
    with get_db() as conn:
        cur = conn.cursor()

        # 1. Challenge Library (Daily & Platform Challenges)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS challenge_library (
                id TEXT PRIMARY KEY,
                subject_id TEXT NOT NULL,
                title TEXT NOT NULL,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                description TEXT NOT NULL,
                code_snippet TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option TEXT NOT NULL,
                explanation TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 50,
                is_active INTEGER NOT NULL DEFAULT 1,
                scheduled_date TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Challenge Submissions & History
        cur.execute("""
            CREATE TABLE IF NOT EXISTS challenge_submissions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                submitted_answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                points_awarded INTEGER NOT NULL DEFAULT 0,
                completed_date TEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, challenge_id)
            );
        """)

        # 3. Learning & Challenge Streaks
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_streaks (
                user_id TEXT PRIMARY KEY,
                current_streak INTEGER NOT NULL DEFAULT 0,
                longest_streak INTEGER NOT NULL DEFAULT 0,
                last_activity_date TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Battle Invitations
        cur.execute("""
            CREATE TABLE IF NOT EXISTS battle_invitations (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                recipient_id TEXT NOT NULL,
                recipient_name TEXT NOT NULL,
                subject_id TEXT NOT NULL DEFAULT 'subj_python',
                status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
                battle_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. 1v1 Battles
        cur.execute("""
            CREATE TABLE IF NOT EXISTS battles (
                id TEXT PRIMARY KEY,
                player_one_id TEXT NOT NULL,
                player_one_name TEXT NOT NULL,
                player_two_id TEXT NOT NULL,
                player_two_name TEXT NOT NULL,
                subject_id TEXT NOT NULL DEFAULT 'subj_python',
                status TEXT NOT NULL DEFAULT 'CREATED', -- CREATED, ACTIVE, COMPLETED, CANCELLED
                questions_json TEXT NOT NULL,
                player_one_answers TEXT DEFAULT '{}',
                player_two_answers TEXT DEFAULT '{}',
                player_one_ready INTEGER NOT NULL DEFAULT 0,
                player_two_ready INTEGER NOT NULL DEFAULT 0,
                player_one_time REAL DEFAULT 0.0,
                player_two_time REAL DEFAULT 0.0,
                winner_id TEXT,
                outcome TEXT, -- WIN, TIE
                result_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP
            );
        """)

        # 6. Battle Stats
        cur.execute("""
            CREATE TABLE IF NOT EXISTS battle_stats (
                user_id TEXT PRIMARY KEY,
                total_battles INTEGER NOT NULL DEFAULT 0,
                wins INTEGER NOT NULL DEFAULT 0,
                losses INTEGER NOT NULL DEFAULT 0,
                ties INTEGER NOT NULL DEFAULT 0,
                win_streak INTEGER NOT NULL DEFAULT 0,
                battle_xp INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 7. Organizations (College & Company Hosts)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                org_type TEXT NOT NULL, -- PLATFORM, STUDENT, COLLEGE, COMPANY
                domain TEXT,
                description TEXT NOT NULL,
                logo_url TEXT,
                is_verified INTEGER NOT NULL DEFAULT 0,
                created_by_user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 8. Hosted Competitions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS hosted_competitions (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                host_type TEXT NOT NULL, -- PLATFORM, STUDENT, COLLEGE, COMPANY
                subject_id TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'Intermediate',
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                eligibility_rules TEXT NOT NULL DEFAULT 'OPEN',
                questions_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'SCHEDULED', -- DRAFT, SCHEDULED, ACTIVE, COMPLETED, ARCHIVED
                created_by_user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 9. Competition Submissions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS competition_submissions (
                id TEXT PRIMARY KEY,
                competition_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                percentage REAL NOT NULL,
                time_taken_seconds REAL NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(competition_id, user_id)
            );
        """)

        # 10. Unified Points Ledger (XP Ledger)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS xp_ledger (
                id TEXT PRIMARY KEY,
                event_key TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                points_delta INTEGER NOT NULL,
                reason TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                origin TEXT NOT NULL DEFAULT 'live',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 11. User Referral Codes & Referrals
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_referral_codes (
                user_id TEXT PRIMARY KEY,
                referral_code TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS referrals (
                id TEXT PRIMARY KEY,
                referrer_id TEXT NOT NULL,
                referee_id TEXT UNIQUE NOT NULL,
                referral_code TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, QUALIFIED, REWARDED
                milestone_type TEXT,
                referrer_reward_points INTEGER NOT NULL DEFAULT 150,
                referee_reward_points INTEGER NOT NULL DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qualified_at TIMESTAMP
            );
        """)

        # 12. Certificates
        cur.execute("""
            CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                verification_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                cert_type TEXT NOT NULL, -- ASSESSMENT, BATTLE_WINNER, COMPETITION_WINNER, TRACK_COMPLETION
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                metadata_json TEXT NOT NULL,
                verification_hash TEXT NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 13. Reward Store Catalog & Redemptions
        cur.execute("""
            CREATE TABLE IF NOT EXISTS reward_catalog (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                xp_cost INTEGER NOT NULL,
                icon TEXT NOT NULL DEFAULT 'gift',
                stock INTEGER NOT NULL DEFAULT 100,
                is_active INTEGER NOT NULL DEFAULT 1
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS reward_redemptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                reward_id TEXT NOT NULL,
                xp_spent INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'CONFIRMED',
                redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Seed initial challenge library if empty
        cur.execute("SELECT COUNT(*) AS cnt FROM challenge_library;")
        if cur.fetchone()["cnt"] == 0:
            seed_challenges = [
                (
                    "chal_py_01", "subj_python", "List Mutation & References",
                    "Data Structures", "Medium",
                    "Determine matrix output when shallow multiplying inner lists.",
                    "matrix = [[0] * 3] * 3\nmatrix[0][0] = 7\nprint([row[0] for row in matrix])",
                    "[7, 0, 0]", "[7, 7, 7]", "[[7, 0, 0], [0, 0, 0], [0, 0, 0]]", "TypeError",
                    "B", "Multiplying a list duplicates references to the identical list object in memory.", 50, 1, None, "system"
                ),
                (
                    "chal_py_02", "subj_python", "Scope Resolution: LEGB Rule",
                    "Functions & Scope", "Medium",
                    "Identify variable lookup resolution order in Python.",
                    "x = 'global'\ndef outer():\n    x = 'outer'\n    def inner():\n        return x\n    return inner()\nprint(outer())",
                    "global", "outer", "None", "UnboundLocalError",
                    "B", "Python checks enclosing local scopes before module global scope.", 50, 1, None, "system"
                ),
                (
                    "chal_py_03", "subj_python", "Tuple Immutability & Dict Keys",
                    "Collections & Hashing", "Easy",
                    "Understand why tuples are valid dictionary keys while lists are not.",
                    "valid_key = (1, 2)\ninvalid_key = [1, 2]\nd = {valid_key: 'ok'}\nprint(d[valid_key])",
                    "TypeError", "ok", "None", "{ (1, 2): 'ok' }",
                    "B", "Tuples with immutable elements are hashable and thus valid dictionary keys.", 50, 1, None, "system"
                ),
                (
                    "chal_py_04", "subj_python", "List Comprehension vs Generator",
                    "Generators & Memory", "Hard",
                    "Distinguish eager memory allocation from lazy iterator generation.",
                    "import sys\ngen = (x for x in range(10000))\nlst = [x for x in range(10000)]\nprint(sys.getsizeof(gen) < sys.getsizeof(lst))",
                    "True", "False", "TypeError", "ZeroDivisionError",
                    "A", "Generators produce items on demand with O(1) memory overhead.", 75, 1, None, "system"
                ),
                (
                    "chal_py_05", "subj_python", "Dictionary Comprehensions",
                    "Functional Python", "Medium",
                    "Calculate dictionary comprehension mapping.",
                    "d = {k: k**2 for k in range(4) if k % 2 == 1}\nprint(sum(d.values()))",
                    "10", "16", "9", "8",
                    "A", "k=1 -> 1, k=3 -> 9. 1 + 9 = 10.", 50, 1, None, "system"
                )
            ]
            cur.executemany("""
                INSERT INTO challenge_library (
                    id, subject_id, title, topic, difficulty, description, code_snippet,
                    option_a, option_b, option_c, option_d, correct_option, explanation,
                    points, is_active, scheduled_date, created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, seed_challenges)

        # Seed initial organizations if empty
        cur.execute("SELECT COUNT(*) AS cnt FROM organizations;")
        if cur.fetchone()["cnt"] == 0:
            cur.executemany("""
                INSERT INTO organizations (id, name, org_type, domain, description, is_verified, created_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, [
                ("org_pragyax", "PragyaX Foundation", "PLATFORM", "pragyax.org", "Official platform competitive learning sponsor", 1, "system_admin"),
                ("org_iitd", "IIT Delhi Coding Club", "COLLEGE", "iitd.ac.in", "Inter-college competitive programming chapter", 1, "system_admin"),
                ("org_google", "Google Developer Student Club", "COMPANY", "google.com", "Industry practical algorithmic challenges", 1, "system_admin")
            ])

        # Seed initial reward catalog if empty
        cur.execute("SELECT COUNT(*) AS cnt FROM reward_catalog;")
        if cur.fetchone()["cnt"] == 0:
            cur.executemany("""
                INSERT INTO reward_catalog (id, title, description, category, xp_cost, icon, stock, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, [
                ("rwd_swag_sticker", "PragyaX Hacker Hologram Sticker Pack", "Exclusive holographic physical stickers", "SWAG", 200, "sparkles", 500, 1),
                ("rwd_pro_badge", "Python Virtuoso Profile Badge", "Permanent golden badge on leaderboards", "DIGITAL", 350, "award", 999, 1),
                ("rwd_mentor_session", "1-on-1 AI & Systems Engineering Mentorship", "30-minute career & code review session", "MENTORSHIP", 1000, "user-check", 20, 1),
                ("rwd_cert_voucher", "Verified Course Completion Certificate Voucher", "Free tamper-evident certificate issuance", "CERTIFICATE", 500, "file-text", 999, 1)
            ])


class CompetitionRepository:
    """DAO for Challenges, Battles, Organizations, Competitions, Referrals, Certificates & Gamification."""

    # =========================================================================
    # A. CHALLENGE MANAGEMENT
    # =========================================================================

    @staticmethod
    def get_all_challenges(topic: Optional[str] = None, difficulty: Optional[str] = None) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            query = "SELECT * FROM challenge_library WHERE is_active = 1"
            params = []
            if topic:
                query += " AND topic = ?"
                params.append(topic)
            if difficulty:
                query += " AND difficulty = ?"
                params.append(difficulty)
            query += " ORDER BY created_at DESC;"
            cur.execute(query, tuple(params))
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def get_challenge_by_id(challenge_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM challenge_library WHERE id = ?;", (challenge_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def create_challenge(data: Dict[str, Any]) -> Dict[str, Any]:
        init_competition_tables()
        cid = data.get("id") or f"chal_{uuid.uuid4().hex[:10]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO challenge_library (
                    id, subject_id, title, topic, difficulty, description, code_snippet,
                    option_a, option_b, option_c, option_d, correct_option, explanation,
                    points, is_active, scheduled_date, created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                cid, data["subject_id"], data["title"], data["topic"], data["difficulty"],
                data["description"], data["code_snippet"], data["option_a"], data["option_b"],
                data["option_c"], data["option_d"], data["correct_option"].strip().upper(),
                data["explanation"], data.get("points", 50), data.get("is_active", 1),
                data.get("scheduled_date"), data.get("created_by", "admin")
            ))
        return CompetitionRepository.get_challenge_by_id(cid)

    @staticmethod
    def update_challenge(challenge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        allowed = {"title", "topic", "difficulty", "description", "code_snippet", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation", "points", "is_active", "scheduled_date"}
        fields = [f"{k} = ?" for k in updates if k in allowed]
        if not fields:
            return CompetitionRepository.get_challenge_by_id(challenge_id)
        values = [updates[k] for k in updates if k in allowed] + [challenge_id]
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE challenge_library SET {', '.join(fields)} WHERE id = ?;", tuple(values))
        return CompetitionRepository.get_challenge_by_id(challenge_id)

    @staticmethod
    def get_user_challenge_submission(user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM challenge_submissions WHERE user_id = ? AND challenge_id = ?;", (user_id, challenge_id))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def record_challenge_submission(user_id: str, challenge_id: str, submitted_answer: str, is_correct: bool, points_awarded: int, completed_date: str) -> Dict[str, Any]:
        init_competition_tables()
        sub_id = f"csub_{uuid.uuid4().hex[:12]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR IGNORE INTO challenge_submissions (
                    id, user_id, challenge_id, submitted_answer, is_correct, points_awarded, completed_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (sub_id, user_id, challenge_id, submitted_answer.strip().upper(), 1 if is_correct else 0, points_awarded, completed_date))
        return CompetitionRepository.get_user_challenge_submission(user_id, challenge_id)

    @staticmethod
    def get_user_challenge_history(user_id: str) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT s.*, c.title, c.topic, c.difficulty
                FROM challenge_submissions s
                JOIN challenge_library c ON s.challenge_id = c.id
                WHERE s.user_id = ?
                ORDER BY s.submitted_at DESC;
            """, (user_id,))
            return [dict(r) for r in cur.fetchall()]

    # =========================================================================
    # STREAKS
    # =========================================================================

    @staticmethod
    def get_user_streak(user_id: str) -> Dict[str, Any]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM user_streaks WHERE user_id = ?;", (user_id,))
            row = cur.fetchone()
            if row:
                return dict(row)
            return {"user_id": user_id, "current_streak": 0, "longest_streak": 0, "last_activity_date": None}

    @staticmethod
    def update_user_streak(user_id: str, activity_date: str) -> Dict[str, Any]:
        init_competition_tables()
        current = CompetitionRepository.get_user_streak(user_id)
        last_date = current.get("last_activity_date")
        curr_streak = current.get("current_streak", 0)
        max_streak = current.get("longest_streak", 0)

        if not last_date:
            new_curr = 1
        elif last_date == activity_date:
            new_curr = curr_streak  # Same day activity does not advance or reset
        else:
            try:
                prev_d = date.fromisoformat(last_date)
                today_d = date.fromisoformat(activity_date)
                delta = (today_d - prev_d).days
                if delta == 1:
                    new_curr = curr_streak + 1
                else:
                    new_curr = 1
            except Exception:
                new_curr = 1

        new_max = max(max_streak, new_curr)

        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    current_streak = excluded.current_streak,
                    longest_streak = excluded.longest_streak,
                    last_activity_date = excluded.last_activity_date,
                    updated_at = CURRENT_TIMESTAMP;
            """, (user_id, new_curr, new_max, activity_date))

        return {"user_id": user_id, "current_streak": new_curr, "longest_streak": new_max, "last_activity_date": activity_date}

    # =========================================================================
    # B. 1V1 BATTLE SYSTEM
    # =========================================================================

    @staticmethod
    def create_battle_invitation(sender_id: str, sender_name: str, recipient_id: str, recipient_name: str, subject_id: str = "subj_python") -> Dict[str, Any]:
        init_competition_tables()
        inv_id = f"binv_{uuid.uuid4().hex[:10]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO battle_invitations (id, sender_id, sender_name, recipient_id, recipient_name, subject_id, status)
                VALUES (?, ?, ?, ?, ?, ?, 'PENDING');
            """, (inv_id, sender_id, sender_name, recipient_id, recipient_name, subject_id))
        return CompetitionRepository.get_invitation_by_id(inv_id)

    @staticmethod
    def get_invitation_by_id(inv_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM battle_invitations WHERE id = ?;", (inv_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def update_invitation_status(inv_id: str, status: str, battle_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE battle_invitations SET status = ?, battle_id = COALESCE(?, battle_id) WHERE id = ?;", (status, battle_id, inv_id))
        return CompetitionRepository.get_invitation_by_id(inv_id)

    @staticmethod
    def get_user_invitations(user_id: str) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM battle_invitations WHERE recipient_id = ? OR sender_id = ? ORDER BY created_at DESC;", (user_id, user_id))
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def create_battle(battle_id: str, p1_id: str, p1_name: str, p2_id: str, p2_name: str, subject_id: str, questions: list) -> Dict[str, Any]:
        init_competition_tables()
        q_json = json.dumps(questions)
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO battles (
                    id, player_one_id, player_one_name, player_two_id, player_two_name,
                    subject_id, status, questions_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'CREATED', ?, CURRENT_TIMESTAMP);
            """, (battle_id, p1_id, p1_name, p2_id, p2_name, subject_id, q_json))
        return CompetitionRepository.get_battle_by_id(battle_id)

    @staticmethod
    def get_battle_by_id(battle_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM battles WHERE id = ?;", (battle_id,))
            row = cur.fetchone()
            if not row:
                return None
            res = dict(row)
            res["questions"] = json.loads(res["questions_json"])
            res["player_one_answers"] = json.loads(res["player_one_answers"] or "{}")
            res["player_two_answers"] = json.loads(res["player_two_answers"] or "{}")
            res["result"] = json.loads(res["result_json"]) if res.get("result_json") else None
            return res

    @staticmethod
    def update_battle_state(battle_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        allowed = {
            "status", "player_one_answers", "player_two_answers",
            "player_one_ready", "player_two_ready", "player_one_time", "player_two_time",
            "winner_id", "outcome", "result_json", "started_at", "completed_at"
        }
        fields = []
        values = []
        for k, v in updates.items():
            if k in allowed:
                fields.append(f"{k} = ?")
                if isinstance(v, (dict, list)):
                    values.append(json.dumps(v))
                else:
                    values.append(v)
        if not fields:
            return CompetitionRepository.get_battle_by_id(battle_id)
        values.append(battle_id)
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE battles SET {', '.join(fields)} WHERE id = ?;", tuple(values))
        return CompetitionRepository.get_battle_by_id(battle_id)

    @staticmethod
    def get_user_battles(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT * FROM battles
                WHERE player_one_id = ? OR player_two_id = ?
                ORDER BY created_at DESC
                LIMIT ?;
            """, (user_id, user_id, limit))
            rows = cur.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["result"] = json.loads(item["result_json"]) if item.get("result_json") else None
                results.append(item)
            return results

    @staticmethod
    def update_battle_stats(user_id: str, is_win: bool, is_tie: bool, xp_delta: int) -> Dict[str, Any]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM battle_stats WHERE user_id = ?;", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.execute("""
                    INSERT INTO battle_stats (user_id, total_battles, wins, losses, ties, win_streak, battle_xp)
                    VALUES (?, 1, ?, ?, ?, ?, ?);
                """, (
                    user_id,
                    1 if is_win else 0,
                    0 if (is_win or is_tie) else 1,
                    1 if is_tie else 0,
                    1 if is_win else 0,
                    xp_delta
                ))
            else:
                s = dict(row)
                tot = s["total_battles"] + 1
                w = s["wins"] + (1 if is_win else 0)
                t = s["ties"] + (1 if is_tie else 0)
                l = s["losses"] + (0 if (is_win or is_tie) else 1)
                streak = (s["win_streak"] + 1) if is_win else 0
                xp = s["battle_xp"] + xp_delta
                cur.execute("""
                    UPDATE battle_stats
                    SET total_battles = ?, wins = ?, losses = ?, ties = ?, win_streak = ?, battle_xp = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?;
                """, (tot, w, l, t, streak, xp, user_id))
        return CompetitionRepository.get_battle_stats(user_id)

    @staticmethod
    def get_battle_stats(user_id: str) -> Dict[str, Any]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM battle_stats WHERE user_id = ?;", (user_id,))
            row = cur.fetchone()
            if row:
                return dict(row)
            return {
                "user_id": user_id,
                "total_battles": 0,
                "wins": 0,
                "losses": 0,
                "ties": 0,
                "win_streak": 0,
                "battle_xp": 0
            }

    get_user_battle_stats = get_battle_stats

    @staticmethod
    def get_battle_leaderboard(limit: int = 25) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT b.user_id, u.name, b.total_battles, b.wins, b.losses, b.ties, b.win_streak, b.battle_xp
                FROM battle_stats b
                JOIN users u ON b.user_id = u.id
                ORDER BY b.wins DESC, b.battle_xp DESC
                LIMIT ?;
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]

    # =========================================================================
    # C. COLLEGE AND COMPANY HOSTED CHALLENGES
    # =========================================================================

    @staticmethod
    def create_organization(name: str, org_type: str, domain: Optional[str], description: str, created_by: str, is_verified: bool = False) -> Dict[str, Any]:
        init_competition_tables()
        org_id = f"org_{uuid.uuid4().hex[:10]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO organizations (id, name, org_type, domain, description, is_verified, created_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (org_id, name, org_type, domain, description, 1 if is_verified else 0, created_by))
        return CompetitionRepository.get_organization_by_id(org_id)

    @staticmethod
    def get_organization_by_id(org_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM organizations WHERE id = ?;", (org_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def list_organizations(verified_only: bool = False) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            query = "SELECT * FROM organizations"
            if verified_only:
                query += " WHERE is_verified = 1"
            query += " ORDER BY name ASC;"
            cur.execute(query)
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def verify_organization(org_id: str, is_verified: bool = True) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE organizations SET is_verified = ? WHERE id = ?;", (1 if is_verified else 0, org_id))
        return CompetitionRepository.get_organization_by_id(org_id)

    @staticmethod
    def create_hosted_competition(data: Dict[str, Any]) -> Dict[str, Any]:
        init_competition_tables()
        comp_id = f"comp_{uuid.uuid4().hex[:10]}"
        q_json = json.dumps(data["questions"])
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO hosted_competitions (
                    id, org_id, title, description, host_type, subject_id, difficulty,
                    start_time, end_time, eligibility_rules, questions_json, status, created_by_user_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                comp_id, data["org_id"], data["title"], data["description"], data["host_type"],
                data["subject_id"], data.get("difficulty", "Intermediate"),
                data["start_time"], data["end_time"], data.get("eligibility_rules", "OPEN"),
                q_json, data.get("status", "SCHEDULED"), data["created_by_user_id"]
            ))
        return CompetitionRepository.get_hosted_competition_by_id(comp_id)

    @staticmethod
    def get_hosted_competition_by_id(comp_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT c.*, o.name AS org_name, o.is_verified AS org_is_verified
                FROM hosted_competitions c
                JOIN organizations o ON c.org_id = o.id
                WHERE c.id = ?;
            """, (comp_id,))
            row = cur.fetchone()
            if not row:
                return None
            res = dict(row)
            res["questions"] = json.loads(res["questions_json"])
            return res

    @staticmethod
    def list_hosted_competitions(status: Optional[str] = None, host_type: Optional[str] = None) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            query = """
                SELECT c.*, o.name AS org_name, o.is_verified AS org_is_verified
                FROM hosted_competitions c
                JOIN organizations o ON c.org_id = o.id
                WHERE 1=1
            """
            params = []
            if status:
                query += " AND c.status = ?"
                params.append(status)
            if host_type:
                query += " AND c.host_type = ?"
                params.append(host_type)
            query += " ORDER BY c.start_time DESC;"
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["questions"] = json.loads(item["questions_json"])
                results.append(item)
            return results

    @staticmethod
    def record_competition_submission(comp_id: str, user_id: str, user_name: str, score: int, total_questions: int, time_taken: float) -> Dict[str, Any]:
        init_competition_tables()
        sub_id = f"cpsub_{uuid.uuid4().hex[:10]}"
        percentage = round((score / total_questions * 100), 1) if total_questions > 0 else 0.0
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR REPLACE INTO competition_submissions (
                    id, competition_id, user_id, user_name, score, total_questions, percentage, time_taken_seconds, submitted_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
            """, (sub_id, comp_id, user_id, user_name, score, total_questions, percentage, time_taken))
        return {
            "id": sub_id,
            "competition_id": comp_id,
            "user_id": user_id,
            "user_name": user_name,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "time_taken_seconds": time_taken
        }

    @staticmethod
    def get_competition_leaderboard(comp_id: str) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT user_id, user_name, score, total_questions, percentage, time_taken_seconds, submitted_at
                FROM competition_submissions
                WHERE competition_id = ?
                ORDER BY score DESC, time_taken_seconds ASC;
            """, (comp_id,))
            rows = cur.fetchall()
            ranked = []
            for rank, r in enumerate(rows, start=1):
                item = dict(r)
                item["rank"] = rank
                ranked.append(item)
            return ranked

    # =========================================================================
    # D. UNIFIED GAMIFICATION & XP LEDGER
    # =========================================================================

    @staticmethod
    def record_xp_event(user_id: str, event_key: str, points: int, reason: str, source_type: str, source_id: str) -> bool:
        """Records XP event idempotently. Returns True if awarded, False if already awarded."""
        init_competition_tables()
        eid = f"xpe_{uuid.uuid4().hex[:10]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT OR IGNORE INTO xp_ledger (id, event_key, user_id, points_delta, reason, source_type, source_id)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (eid, event_key, user_id, points, reason, source_type, source_id))
            return cur.rowcount > 0

    @staticmethod
    def get_user_total_xp(user_id: str) -> int:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COALESCE(SUM(points_delta), 0) AS total FROM xp_ledger WHERE user_id = ?;", (user_id,))
            return cur.fetchone()["total"]

    @staticmethod
    def get_user_xp_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM xp_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?;", (user_id, limit))
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def get_reward_catalog() -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM reward_catalog WHERE is_active = 1 ORDER BY xp_cost ASC;")
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def redeem_reward(user_id: str, reward_id: str) -> Dict[str, Any]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM reward_catalog WHERE id = ? AND is_active = 1;", (reward_id,))
            reward = cur.fetchone()
            if not reward:
                return {"error": "Reward not found or inactive"}
            cost = reward["xp_cost"]
            cur.execute("SELECT COALESCE(SUM(points_delta), 0) AS total FROM xp_ledger WHERE user_id = ?;", (user_id,))
            cur_xp = cur.fetchone()["total"]
            if cur_xp < cost:
                return {"error": f"Insufficient XP. Requires {cost} XP, you have {cur_xp} XP."}

            # Record deduction in ledger
            red_id = f"red_{uuid.uuid4().hex[:10]}"
            event_key = f"redeem.{user_id}.{reward_id}.{red_id}"
            cur.execute("""
                INSERT INTO xp_ledger (id, event_key, user_id, points_delta, reason, source_type, source_id)
                VALUES (?, ?, ?, ?, 'REWARD_REDEMPTION', 'reward_catalog', ?);
            """, (f"xpe_{uuid.uuid4().hex[:10]}", event_key, user_id, -cost, reward_id))

            cur.execute("""
                INSERT INTO reward_redemptions (id, user_id, reward_id, xp_spent)
                VALUES (?, ?, ?, ?);
            """, (red_id, user_id, reward_id, cost))

            return {
                "redemption_id": red_id,
                "reward_title": reward["title"],
                "xp_spent": cost,
                "remaining_xp": cur_xp - cost,
                "status": "CONFIRMED"
            }

    # =========================================================================
    # E. REFERRAL SYSTEM
    # =========================================================================

    @staticmethod
    def get_or_create_user_referral_code(user_id: str, user_name: str) -> str:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT referral_code FROM user_referral_codes WHERE user_id = ?;", (user_id,))
            row = cur.fetchone()
            if row:
                return row["referral_code"]
            # Generate deterministic, clean referral code
            clean_name = "".join(c for c in user_name.upper() if c.isalnum())[:6] or "PRAGYA"
            code = f"PRAGYA-{clean_name}-{user_id[-4:].upper()}"
            cur.execute("INSERT OR IGNORE INTO user_referral_codes (user_id, referral_code) VALUES (?, ?);", (user_id, code))
            return code

    @staticmethod
    def get_user_id_by_referral_code(referral_code: str) -> Optional[str]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT user_id FROM user_referral_codes WHERE UPPER(referral_code) = UPPER(?);", (referral_code.strip(),))
            row = cur.fetchone()
            return row["user_id"] if row else None

    @staticmethod
    def record_pending_referral(referrer_id: str, referee_id: str, referral_code: str) -> Dict[str, Any]:
        init_competition_tables()
        if referrer_id == referee_id:
            return {"error": "Self-referral is not permitted"}
        ref_id = f"ref_{uuid.uuid4().hex[:10]}"
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM referrals WHERE referee_id = ?;", (referee_id,))
            if cur.fetchone():
                return {"error": "User already has an active or completed referral"}
            cur.execute("""
                INSERT INTO referrals (id, referrer_id, referee_id, referral_code, status)
                VALUES (?, ?, ?, ?, 'PENDING');
            """, (ref_id, referrer_id, referee_id, referral_code))
        return {"id": ref_id, "referrer_id": referrer_id, "referee_id": referee_id, "status": "PENDING"}

    @staticmethod
    def qualify_referral(referee_id: str, milestone_type: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM referrals WHERE referee_id = ? AND status = 'PENDING';", (referee_id,))
            row = cur.fetchone()
            if not row:
                return None
            ref = dict(row)
            # Mark QUALIFIED
            cur.execute("""
                UPDATE referrals
                SET status = 'QUALIFIED', milestone_type = ?, qualified_at = CURRENT_TIMESTAMP
                WHERE id = ?;
            """, (milestone_type, ref["id"]))
            return dict(ref)

    @staticmethod
    def get_user_referrals_summary(user_id: str) -> Dict[str, Any]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT r.*, u.name AS referee_name, u.email AS referee_email
                FROM referrals r
                JOIN users u ON r.referee_id = u.id
                WHERE r.referrer_id = ?
                ORDER BY r.created_at DESC;
            """, (user_id,))
            history = [dict(row) for row in cur.fetchall()]
            total_invited = len(history)
            qualified = len([h for h in history if h["status"] in ("QUALIFIED", "REWARDED")])
            pending = total_invited - qualified
            xp_earned = qualified * 150
            return {
                "total_invited": total_invited,
                "pending_referrals": pending,
                "successful_referrals": qualified,
                "xp_earned_from_referrals": xp_earned,
                "referral_history": history
            }

    # =========================================================================
    # F. CERTIFICATES & VERIFICATION
    # =========================================================================

    @staticmethod
    def issue_certificate(user_id: str, user_name: str, cert_type: str, title: str, description: str, metadata: dict) -> Dict[str, Any]:
        init_competition_tables()
        cid = f"cert_{uuid.uuid4().hex[:10]}"
        year = datetime.now().year
        rand_token = uuid.uuid4().hex[:8].upper()
        verif_id = f"PRAGYA-CERT-{year}-{rand_token}"

        # Authenticated cryptographic signature (HMAC-SHA256 with server SECRET_KEY)
        import hmac
        from ..config import settings
        raw_payload = f"{verif_id}:{user_id}:{cert_type}:{title}".encode("utf-8")
        verif_hash = hmac.new(settings.SECRET_KEY.encode("utf-8"), raw_payload, hashlib.sha256).hexdigest()

        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO certificates (
                    id, verification_id, user_id, user_name, cert_type, title, description, metadata_json, verification_hash
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (cid, verif_id, user_id, user_name, cert_type, title, description, json.dumps(metadata), verif_hash))

        return CompetitionRepository.get_certificate_by_verification_id(verif_id)

    @staticmethod
    def get_certificate_by_verification_id(verif_id: str) -> Optional[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM certificates WHERE verification_id = ?;", (verif_id,))
            row = cur.fetchone()
            if not row:
                return None
            res = dict(row)
            res["metadata"] = json.loads(res["metadata_json"])
            return res

    @staticmethod
    def get_user_certificates(user_id: str) -> List[Dict[str, Any]]:
        init_competition_tables()
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC;", (user_id,))
            rows = cur.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["metadata"] = json.loads(item["metadata_json"])
                results.append(item)
            return results
