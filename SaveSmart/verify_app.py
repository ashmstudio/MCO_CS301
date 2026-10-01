import json
from pathlib import Path
from uuid import uuid4
import urllib.request
import urllib.error
from http.cookiejar import CookieJar

base = "http://127.0.0.1:5000"
project_dir = Path(__file__).resolve().parent

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def request_json(path, payload=None, method="GET"):
    headers = {"Content-Type": "application/json"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    with opener.open(req) as resp:
        return json.loads(resp.read().decode("utf-8")), resp.status

home_request = urllib.request.Request(base + "/", method="GET")
with opener.open(home_request) as response:
    home_html = response.read().decode("utf-8")
    home_status = response.status
print("HOME_OK", home_status == 200 and "<title>SaveSmart</title>" in home_html and "SaveSmart" in home_html)

register_payload = {
    "name": "Ash Muso",
    "email": f"verify-{uuid4().hex}@example.com",
    "password": "secret123",
    "confirmPassword": "secret123",
}
reg_data, reg_status = request_json("/api/register", payload=register_payload, method="POST")
print("REGISTER_OK", reg_status == 200 and reg_data.get("success") is True)

assessment_payload = {
    "studentName": "Ash Muso",
    "monthlyAllowance": "1500",
    "allowanceFrequency": "weekly",
    "food": "600",
    "transportation": "200",
    "school": "300",
    "internet": "150",
    "personal": "250",
    "other": "100",
    "currentSavings": "500",
    "goalPurpose": "Gadget / Laptop",
    "savingsGoal": "12000",
    "savingPeriod": "6",
    "plannedMonthlySavings": "1800",
}
assessment_data, assessment_status = request_json("/api/assessment", payload=assessment_payload, method="POST")
print("ASSESSMENT_OK", assessment_status == 200 and assessment_data.get("success") is True and assessment_data.get("result", {}).get("status") in {"GREEN", "YELLOW", "RED"})

history_data, history_status = request_json("/api/history", method="GET")
print("HISTORY_COUNT", history_status == 200 and len(history_data.get("assessments", [])) >= 1)

with (project_dir / "data" / "users.json").open("r", encoding="utf-8") as f:
    users = json.load(f)
with (project_dir / "data" / "assessments.json").open("r", encoding="utf-8") as f:
    records = json.load(f)

print("USER_RECORDS", len(users) >= 1 and "password_hash" in users[0])
print("ASSESSMENT_RECORDS", len(records) >= 1)
print("STATUS", records[0].get("assessment_status"))
