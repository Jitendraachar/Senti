FocusMate — Offline demo package
===============================
This archive contains a complete offline-ready demo of the FocusMate MCA project.
It includes a Flask backend (offline-safe rule-based sentiment), static presentation UI, a minimal React frontend skeleton, seed data, and setup instructions.

Quick start (Windows)
---------------------
1. Extract (or create) the folder at D:\FocusMate\focusmate_offline_project
2. Ensure MongoDB Community Server is installed and create a DB folder:
   mkdir D:\data\db
3. Start MongoDB:
   & 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath 'D:\data\db'
4. Backend:
   cd D:\FocusMate\focusmate_offline_project
   python -m venv venv
   .\\venv\\Scripts\\Activate.ps1
   pip install -r requirements.txt
   python seed.py
   python app.py
5. Static UI (presentation):
   Open http://127.0.0.1:5000/static/dashboard.html in your browser.
6. React frontend (optional):
   cd frontend
   npm install
   npm start
