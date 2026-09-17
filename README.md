# MCO_CS301

SaveSmart is a Flask web application that helps students assess whether a savings goal fits their income, expenses, and saving period.

## Run locally

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