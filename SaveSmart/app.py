from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
USERS_PATH = DATA_DIR / "users.json"
ASSESSMENTS_PATH = DATA_DIR / "assessments.json"

app = Flask(__name__, static_folder="templates/static", template_folder="templates")
app.secret_key = "student-savings-assessment-secret-key"


def ensure_data_files() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    for path in (USERS_PATH, ASSESSMENTS_PATH):
        if not path.exists():
            path.write_text("[]", encoding="utf-8")


def read_json(path: Path):
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_json(path: Path, payload):
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)


def valid_email(email: str) -> bool:
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.fullmatch(pattern, email or ""))


def safe_float(value):
    try:
        number = float(value)
        return number if number >= 0 else -1
    except (TypeError, ValueError):
        return -1


def calculate_monthly_income(allowance: float, frequency: str) -> float:
    if frequency == "weekly":
        return allowance * 4
    if frequency == "every_2_weeks":
        return allowance * 2
    return allowance


def calculate_total_expenses(expenses: dict) -> float:
    return (
        float(expenses.get("food", 0) or 0)
        + float(expenses.get("transportation", 0) or 0)
        + float(expenses.get("school", 0) or 0)
        + float(expenses.get("internet", 0) or 0)
        + float(expenses.get("personal", 0) or 0)
        + float(expenses.get("other", 0) or 0)
    )


def calculate_required_monthly_savings(goal: float, current_savings: float, period: float) -> float:
    if period <= 0:
        return 0
    remaining = goal - current_savings
    if remaining <= 0:
        return 0
    return remaining / period


def calculate_expected_savings(current_savings: float, planned: float, period: float) -> float:
    return current_savings + (planned * period)


def assess_goal(available_money: float, required_monthly_savings: float, expected_savings: float, goal_amount: float) -> str:
    if goal_amount <= 0:
        return "GREEN"
    if available_money >= required_monthly_savings and expected_savings >= goal_amount:
        return "GREEN"
    if available_money > 0 and (expected_savings >= goal_amount * 0.8 or available_money >= required_monthly_savings * 0.8):
        return "YELLOW"
    return "RED"


def recommendation_for(status: str) -> str:
    if status == "GREEN":
        return "Your current plan can support your savings goal. Try to save your planned amount consistently each month."
    if status == "YELLOW":
        return "Your goal may be difficult to reach within your selected period. Consider reducing some non-essential expenses or extending the saving period."
    return "Your current available money may not support this goal within the selected period. Consider a smaller goal or a longer saving period."


def get_current_user():
    email = session.get("user_email")
    if not email:
        return None
    users = read_json(USERS_PATH)
    for user in users:
        if user.get("email", "").lower() == email.lower():
            return user
    return None


@app.before_request
def bootstrap_data():
    ensure_data_files()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/current-user", methods=["GET"])
def current_user_api():
    user = get_current_user()
    if user:
        return jsonify({"logged_in": True, "name": user.get("name", ""), "email": user.get("email", "")})
    return jsonify({"logged_in": False})


@app.route("/api/register", methods=["POST"])
def register_user():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirmPassword") or ""

    if not name:
        return jsonify({"success": False, "message": "Please enter your name."}), 400
    if not email:
        return jsonify({"success": False, "message": "Please enter your email."}), 400
    if not valid_email(email):
        return jsonify({"success": False, "message": "Please enter a valid email."}), 400
    if not password:
        return jsonify({"success": False, "message": "Please enter a password."}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long."}), 400
    if not confirm_password:
        return jsonify({"success": False, "message": "Please confirm your password."}), 400
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match."}), 400

    users = read_json(USERS_PATH)
    if any(user.get("email", "").lower() == email for user in users):
        return jsonify({"success": False, "message": "An account with this email already exists."}), 400

    hashed_password = generate_password_hash(password)
    user_record = {
        "name": name,
        "email": email,
        "password_hash": hashed_password,
        "registration_date": datetime.now().strftime("%B %d, %Y"),
    }
    users.append(user_record)
    write_json(USERS_PATH, users)

    session.clear()
    session["user_email"] = email
    session["user_name"] = name

    return jsonify({"success": True, "message": "Account created successfully!", "user": {"name": name, "email": email}})


@app.route("/api/login", methods=["POST"])
def login_user():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = next((item for item in read_json(USERS_PATH) if item.get("email", "").lower() == email), None)
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    session.clear()
    session["user_email"] = user.get("email")
    session["user_name"] = user.get("name")
    return jsonify({"success": True, "message": "Login successful.", "user": {"name": user.get("name", ""), "email": user.get("email", "")}})


@app.route("/api/logout", methods=["POST"])
def logout_user():
    session.clear()
    return jsonify({"success": True, "message": "You have been logged out."})


@app.route("/api/assessment", methods=["POST"])
def process_assessment():
    if not session.get("user_email"):
        return jsonify({"success": False, "message": "Please log in first to continue."}), 401

    payload = request.get_json(silent=True) or {}
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Unable to find your account."}), 401

    student_name = (payload.get("studentName") or user.get("name", "")).strip()
    monthly_allowance = safe_float(payload.get("monthlyAllowance"))
    allowance_frequency = payload.get("allowanceFrequency") or "monthly"
    food = safe_float(payload.get("food"))
    transportation = safe_float(payload.get("transportation"))
    school = safe_float(payload.get("school"))
    internet = safe_float(payload.get("internet"))
    personal = safe_float(payload.get("personal"))
    other = safe_float(payload.get("other"))
    current_savings = safe_float(payload.get("currentSavings"))
    goal_purpose = payload.get("goalPurpose") or "Personal Goal"
    savings_goal = safe_float(payload.get("savingsGoal"))
    saving_period = safe_float(payload.get("savingPeriod"))
    planned_monthly_savings = safe_float(payload.get("plannedMonthlySavings"))

    if monthly_allowance < 0:
        return jsonify({"success": False, "message": "Please enter a valid amount for monthly allowance."}), 400
    if any(value < 0 for value in (food, transportation, school, internet, personal, other, current_savings, savings_goal, planned_monthly_savings)):
        return jsonify({"success": False, "message": "Please enter valid non-negative amounts."}), 400
    if saving_period <= 0:
        return jsonify({"success": False, "message": "Saving period must be greater than 0."}), 400

    monthly_income = calculate_monthly_income(monthly_allowance, allowance_frequency)
    total_expenses = calculate_total_expenses({
        "food": food,
        "transportation": transportation,
        "school": school,
        "internet": internet,
        "personal": personal,
        "other": other,
    })
    available_money = monthly_income - total_expenses
    required_monthly_savings = calculate_required_monthly_savings(savings_goal, current_savings, saving_period)
    expected_savings = calculate_expected_savings(current_savings, planned_monthly_savings, saving_period)
    status = assess_goal(available_money, required_monthly_savings, expected_savings, savings_goal)
    status_label = {
        "GREEN": "GOAL ACHIEVABLE",
        "YELLOW": "NEEDS ADJUSTMENT",
        "RED": "GOAL NEEDS REVISION",
    }.get(status, "GOAL ACHIEVABLE")

    result = {
        "studentName": student_name,
        "estimatedMonthlyIncome": monthly_income,
        "totalMonthlyExpenses": total_expenses,
        "availableMoney": available_money,
        "currentSavings": current_savings,
        "savingsGoal": savings_goal,
        "requiredMonthlySavings": required_monthly_savings,
        "plannedMonthlySavings": planned_monthly_savings,
        "savingPeriod": saving_period,
        "expectedSavings": expected_savings,
        "goalPurpose": goal_purpose,
        "status": status,
        "statusLabel": status_label,
        "recommendation": recommendation_for(status),
    }

    assessment_record = {
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "date": datetime.now().strftime("%B %d, %Y"),
        "monthly_income": monthly_income,
        "total_expenses": total_expenses,
        "available_money": available_money,
        "required_monthly_savings": required_monthly_savings,
        "current_savings": current_savings,
        "savings_goal": savings_goal,
        "goal_purpose": goal_purpose,
        "saving_period": saving_period,
        "planned_monthly_savings": planned_monthly_savings,
        "expected_savings": expected_savings,
        "assessment_status": status_label,
    }

    assessments = read_json(ASSESSMENTS_PATH)
    assessments.append(assessment_record)
    write_json(ASSESSMENTS_PATH, assessments)

    return jsonify({"success": True, "result": result})


@app.route("/api/history", methods=["GET"])
def assessment_history():
    user = get_current_user()
    if not user:
        return jsonify({"assessments": []})

    assessments = read_json(ASSESSMENTS_PATH)
    user_assessments = [item for item in assessments if item.get("user_email") == user.get("email")]
    user_assessments.sort(key=lambda item: item.get("date", ""), reverse=True)
    return jsonify({"assessments": user_assessments})


@app.route("/api/account", methods=["GET"])
def account_details():
    user = get_current_user()
    if not user:
        return jsonify({"logged_in": False})

    user_email = user.get("email", "").lower()
    assessments = read_json(ASSESSMENTS_PATH)
    user_assessments = [item for item in assessments if item.get("user_email", "").lower() == user_email]
    user_assessments.sort(key=lambda item: item.get("date", ""), reverse=True)

    latest_assessment = user_assessments[0] if user_assessments else {}
    summary = {
        "current_savings": latest_assessment.get("current_savings", 0),
        "savings_goal": latest_assessment.get("savings_goal", 0),
        "goal_purpose": latest_assessment.get("goal_purpose", "Personal Goal"),
        "saving_period": latest_assessment.get("saving_period", 0),
        "planned_monthly_savings": latest_assessment.get("planned_monthly_savings", 0),
        "last_assessment_date": latest_assessment.get("date", "N/A"),
        "last_result": latest_assessment.get("assessment_status", "N/A"),
        "available_money": latest_assessment.get("available_money", None),
        "required_monthly_savings": latest_assessment.get("required_monthly_savings", None),
    }

    return jsonify({
        "logged_in": True,
        "user": {
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "registration_date": user.get("registration_date", "N/A"),
            "status": "Registered",
        },
        "summary": summary,
        "assessments": user_assessments,
    })


@app.route("/api/account", methods=["PUT"])
def update_account():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Please log in first to continue."}), 401

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()

    if not name:
        return jsonify({"success": False, "message": "Please enter your name."}), 400
    if not email:
        return jsonify({"success": False, "message": "Please enter your email."}), 400
    if not valid_email(email):
        return jsonify({"success": False, "message": "Please enter a valid email."}), 400

    users = read_json(USERS_PATH)
    for item in users:
        if item.get("email", "").lower() == email.lower() and item.get("email", "").lower() != user.get("email", "").lower():
            return jsonify({"success": False, "message": "An account with this email already exists."}), 400

    for item in users:
        if item.get("email", "").lower() == user.get("email", "").lower():
            item["name"] = name
            item["email"] = email
            break

    write_json(USERS_PATH, users)

    all_assessments = read_json(ASSESSMENTS_PATH)
    for assessment in all_assessments:
        if assessment.get("user_email", "").lower() == user.get("email", "").lower():
            assessment["user_name"] = name
            assessment["user_email"] = email
    write_json(ASSESSMENTS_PATH, all_assessments)

    session["user_email"] = email
    session["user_name"] = name
    return jsonify({"success": True, "message": "Profile updated successfully."})


@app.route("/api/clear-assessment-data", methods=["POST"])
def clear_assessment_data():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Please log in first to continue."}), 401

    assessments = read_json(ASSESSMENTS_PATH)
    filtered = [item for item in assessments if item.get("user_email", "").lower() != user.get("email", "").lower()]
    write_json(ASSESSMENTS_PATH, filtered)
    return jsonify({"success": True, "message": "Assessment data cleared."})


@app.route("/api/clear-account", methods=["POST"])
def clear_account():
    user = get_current_user()
    if user:
        users = read_json(USERS_PATH)
        updated_users = [item for item in users if item.get("email", "").lower() != user.get("email", "").lower()]
        write_json(USERS_PATH, updated_users)

    session.clear()
    return jsonify({"success": True, "message": "Account cleared."})


if __name__ == "__main__":
    ensure_data_files()
    app.run(debug=True, host="0.0.0.0", port=5000)
