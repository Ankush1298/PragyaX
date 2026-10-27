"""
Test 1v1 Battle System Lifecycle (Section B)
Validates invitations, accept/reject, lobby readiness, synchronized timer & state,
authoritative answer verification, winner determination, XP/stats updates, rematch, and leaderboard.
"""

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import init_db

client = TestClient(app)


import uuid

def _register_and_login(name: str, email: str):
    unique_email = f"{uuid.uuid4().hex[:6]}_{email}"
    client.post("/api/auth/register", json={
        "name": name,
        "email": unique_email,
        "password": "SecurePassword123!"
    })
    token = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!"
    }).json()["token"]
    user_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    return {"Authorization": f"Bearer {token}", "user": user_res.json(), "token": token}


def setup_module():
    init_db()


def test_battle_invitation_rejection_and_self_challenge_prevention():
    p1 = _register_and_login("Duelist A", "duelist_a@pragyax.test")
    p2 = _register_and_login("Duelist B", "duelist_b@pragyax.test")

    # Self-challenge must be rejected
    self_inv = client.post("/api/battles/invite", json={
        "recipient_identifier": p1["user"]["email"],
        "subject_id": "subj_python"
    }, headers={"Authorization": f"Bearer {p1['token']}"})
    assert self_inv.status_code == 400
    assert "cannot challenge yourself" in self_inv.json()["detail"].lower()

    # Challenge student B
    inv_res = client.post("/api/battles/invite", json={
        "recipient_identifier": p2["user"]["email"],
        "subject_id": "subj_python"
    }, headers={"Authorization": f"Bearer {p1['token']}"})
    assert inv_res.status_code == 200
    inv_id = inv_res.json()["invitation"]["id"]

    # Student B rejects the invitation
    reject_res = client.post("/api/battles/invite/respond", json={
        "invitation_id": inv_id,
        "accept": False
    }, headers={"Authorization": f"Bearer {p2['token']}"})
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"


def test_complete_battle_match_lifecycle():
    p1 = _register_and_login("Champion Alice", "alice_battle@pragyax.test")
    p2 = _register_and_login("Challenger Bob", "bob_battle@pragyax.test")

    # 1. Alice invites Bob
    invite_res = client.post("/api/battles/invite", json={
        "recipient_identifier": p2["user"]["email"],
        "subject_id": "subj_python"
    }, headers={"Authorization": f"Bearer {p1['token']}"})
    assert invite_res.status_code == 200
    inv_id = invite_res.json()["invitation"]["id"]

    # 2. Bob accepts
    accept_res = client.post("/api/battles/invite/respond", json={
        "invitation_id": inv_id,
        "accept": True
    }, headers={"Authorization": f"Bearer {p2['token']}"})
    assert accept_res.status_code == 200
    battle_id = accept_res.json()["battle_id"]
    assert battle_id is not None

    # 3. Both inspect initial lobby state (CREATED)
    view_alice = client.get(f"/api/battles/{battle_id}", headers={"Authorization": f"Bearer {p1['token']}"}).json()
    assert view_alice["status"] == "CREATED"
    assert view_alice["opponent_display_name"] == "Challenger Bob"
    assert len(view_alice["questions"]) == 5

    # 4. Ready-up mechanism
    # Alice readies up
    ready_a = client.post(f"/api/battles/{battle_id}/ready", headers={"Authorization": f"Bearer {p1['token']}"})
    assert ready_a.status_code == 200

    # Still CREATED until Bob is also ready
    view_bob = client.get(f"/api/battles/{battle_id}", headers={"Authorization": f"Bearer {p2['token']}"}).json()
    assert view_bob["status"] == "CREATED"

    # Bob readies up -> Battle becomes ACTIVE
    ready_b = client.post(f"/api/battles/{battle_id}/ready", headers={"Authorization": f"Bearer {p2['token']}"})
    assert ready_b.status_code == 200
    assert ready_b.json()["battle"]["status"] == "ACTIVE"

    # 5. Alice submits answers (5/5 correct answers)
    # Python questions answer key: q1: B, q2: C, q3: C, q4: B, q5: A
    q_ids = [q["question_id"] for q in view_alice["questions"]]
    alice_answers = {q_ids[0]: "B", q_ids[1]: "C", q_ids[2]: "C", q_ids[3]: "B", q_ids[4]: "A"}
    sub_a = client.post(f"/api/battles/{battle_id}/submit", json={
        "battle_id": battle_id,
        "answers": alice_answers,
        "time_taken_seconds": 12.5
    }, headers={"Authorization": f"Bearer {p1['token']}"})
    assert sub_a.status_code == 200
    assert sub_a.json()["viewer_submitted"] is True
    # Opponent choices and answer key are STILL masked because Bob hasn't submitted yet!
    assert sub_a.json()["result"] is None

    # 6. Bob submits answers (3/5 correct answers)
    bob_answers = {q_ids[0]: "B", q_ids[1]: "C", q_ids[2]: "A", q_ids[3]: "B", q_ids[4]: "D"}
    sub_b = client.post(f"/api/battles/{battle_id}/submit", json={
        "battle_id": battle_id,
        "answers": bob_answers,
        "time_taken_seconds": 15.0
    }, headers={"Authorization": f"Bearer {p2['token']}"})
    assert sub_b.status_code == 200

    # 7. Both submitted -> Battle transitions to COMPLETED, winner is Alice!
    final_view_bob = sub_b.json()
    assert final_view_bob["status"] == "COMPLETED"
    assert final_view_bob["result"]["winner_user_id"] == p1["user"]["id"]
    assert final_view_bob["result"]["outcome"] == "WIN"
    assert len(final_view_bob["review"]) == 5

    # 8. Rematch mechanism
    rematch_res = client.post(f"/api/battles/{battle_id}/rematch", headers={"Authorization": f"Bearer {p2['token']}"})
    assert rematch_res.status_code == 200
    assert "invitation" in rematch_res.json()

    # 9. Global battle leaderboard contains Alice
    lb_res = client.get("/api/battles/leaderboard/ranking")
    assert lb_res.status_code == 200
    leaderboard = lb_res.json()
    assert len(leaderboard) >= 1
    alice_entry = next((e for e in leaderboard if e["user_id"] == p1["user"]["id"]), None)
    assert alice_entry is not None
    assert alice_entry["wins"] >= 1
    assert alice_entry["battle_xp"] >= 100
