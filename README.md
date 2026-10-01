<<<<<<< Updated upstream

=======
# MCO1: Student Savings Goal Assessment System

This project demonstrates the same Student Savings Goal Assessment System using two programming approaches for CS 301 MCO 1:

- `SaveSmart/procedural_system.js` is the JavaScript procedural version. It uses functions, variables, objects, conditions, and loops without classes.
- `SaveSmart/oop_system.py` is the Python object-oriented version. It uses `SavingsAssessmentInput`, `SavingsAssessmentResult`, and `SavingsAssessmentSystem` classes.

Both versions accept the same input and use the same calculations and decision rules. The Flask application in `SaveSmart/app.py` provides the web interface and uses the Python OOP implementation for its assessment route.

## System input

The system processes a student's name, allowance, allowance frequency, monthly expenses, current savings, goal purpose, savings goal, saving period, and planned monthly savings.

It produces estimated monthly income, total expenses, available money, required monthly savings, expected savings, a `GREEN`, `YELLOW`, or `RED` status, and a recommendation.

## Run the two implementations

From the repository root:

```powershell
node SaveSmart\procedural_system.js
python SaveSmart\oop_system.py
```

The two commands use the same sample input and should produce equivalent result values.

## Run the web interface

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python SaveSmart\app.py
```

Open http://127.0.0.1:5000 in a browser.

## Verify the application

With the app running, execute:

```powershell
python SaveSmart\verify_app.py
```
>>>>>>> Stashed changes
