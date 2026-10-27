import urllib.request
import json

base = "http://127.0.0.1:8000/api"
# Login
req = urllib.request.Request(
    f"{base}/auth/login",
    data=json.dumps({"email": "asha@college.edu", "password": "demo123"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read())["token"]
print("Login: OK")

# Get subjects
sub_req = urllib.request.Request(f"{base}/subjects", headers={"Authorization": f"Bearer {token}"})
sub_data = json.loads(urllib.request.urlopen(sub_req).read())
print("Subjects:", [s["title"] for s in sub_data["subjects"] if s["is_active"]])

# Test each subject's questions
subjects = ["subj_python", "subj_math", "subj_physics", "subj_chemistry", "subj_biology"]
for sid in subjects:
    q_req = urllib.request.Request(f"{base}/assessments/questions?subject_id={sid}", headers={"Authorization": f"Bearer {token}"})
    q_data = json.loads(urllib.request.urlopen(q_req).read())
    print(f"[{sid}] Loaded {len(q_data)} questions. First topic: {q_data[0]['topic']}")
