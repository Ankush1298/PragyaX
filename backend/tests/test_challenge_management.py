"""
Test Challenge Management (Section A)
Validates daily challenge rotation, topic/difficulty filtering,
challenge library, streaks, server-authoritative submission, and leaderboards.
"""

import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import init_db

client = TestClient(app)


def _get_auth_headers(name: str = "Test Learner", email: str = None):
    mail = email or f"learner_{uuid.uuid4().hex[:8]}@pragyax.test"
    client.post("/api/auth/register", json={
        "name": name,
        "email": mail,
        "password": "SecurePassword123!"
    })
    login_res = client.post("/api/auth/login", json={"email": mail, "password": "SecurePassword123!"})
    token = login_res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def setup_module():
    init_db()


def test_daily_challenge_rotation_by_date():
    headers = _get_auth_headers("Rotation Tester")

    # Query with date A
    res_a = client.get("/api/challenges/daily?date_str=2026-10-27", headers=headers)
    assert res_a.status_code == 200
    chal_a = res_a.json()
    assert "title" in chal_a
    assert chal_a["correct_option"] is None  # hidden before completion

    # Query with date B
    res_b = client.get("/api/challenges/daily?date_str=2026-10-28", headers=headers)
    assert res_b.status_code == 200
    chal_b = res_b.json()
    assert "title" in chal_b

    # Determinism: same date produces identical challenge
    res_a2 = client.get("/api/challenges/daily?date_str=2026-10-27", headers=headers)
    assert res_a2.json()["id"] == chal_a["id"]


def test_challenge_library_and_filtering():
    headers = _get_auth_headers("Library Tester")

    # Get entire library
    lib_res = client.get("/api/challenges/library", headers=headers)
    assert lib_res.status_code == 200
    library = lib_res.json()
    assert len(library) >= 5

    # Filter by difficulty
    easy_res = client.get("/api/challenges/library?difficulty=Easy", headers=headers)
    assert easy_res.status_code == 200
    easy_items = easy_res.json()
    assert all(item["difficulty"] == "Easy" for item in easy_items)

    # Filter by topic
    topic_res = client.get("/api/challenges/library?topic=Data Structures", headers=headers)
    assert topic_res.status_code == 200
    for item in topic_res.json():
        assert item["topic"] == "Data Structures"


def test_challenge_submission_streak_and_history():
    u_email = f"runner_{uuid.uuid4().hex[:8]}@pragyax.test"
    client.post("/api/auth/register", json={
        "name": "Streak Runner",
        "email": u_email,
        "password": "SecurePassword123!"
    })
    token = client.post("/api/auth/login", json={
        "email": u_email,
        "password": "SecurePassword123!"
    }).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit answer for seed challenge chal_py_01 (correct option is B)
    sub_res = client.post("/api/challenges/submit", json={
        "challenge_id": "chal_py_01",
        "selected_option": "B"
    }, headers=headers)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["is_correct"] is True
    assert sub_data["points_awarded"] == 50

    # Repeat submission must be rejected
    dup_res = client.post("/api/challenges/submit", json={
        "challenge_id": "chal_py_01",
        "selected_option": "B"
    }, headers=headers)
    assert dup_res.status_code == 400
    assert "already completed" in dup_res.json()["detail"].lower()

    # Check user streak
    streak_res = client.get("/api/challenges/streak", headers=headers)
    assert streak_res.status_code == 200
    streak_data = streak_res.json()
    assert streak_data["current_streak"] >= 1
    assert streak_data["active_today"] is True

    # Check challenge history
    hist_res = client.get("/api/challenges/history", headers=headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) >= 1
    assert hist[0]["challenge_id"] == "chal_py_01"


def test_challenge_leaderboard():
    res = client.get("/api/challenges/leaderboard")
    assert res.status_code == 200
    leaders = res.json()
    assert isinstance(leaders, list)
    if leaders:
        assert "rank" in leaders[0]
        assert "points" in leaders[0]
