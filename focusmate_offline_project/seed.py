from datetime import datetime, timedelta
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import os

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/focusmate')
client = MongoClient(MONGO_URI)
db = client['focusmate']

db.users.delete_many({})
db.tasks.delete_many({})
db.journals.delete_many({})

demo_user = {
    'email': 'demo@focusmate.com',
    'name': 'Demo User',
    'password_hash': generate_password_hash('demopass'),
    'preferences': {'pomodoro_duration': 25, 'break_duration': 5},
    'created_at': datetime.utcnow()
}
user_id = db.users.insert_one(demo_user).inserted_id

tasks = [
    {'user_id': user_id, 'title': 'Complete project documentation', 'description': 'Write synopsis and final report for MCA project', 'priority': 'high', 'due_date': datetime.utcnow() + timedelta(days=2), 'is_done': False, 'pomodoro_sessions': 0, 'created_at': datetime.utcnow()},
    {'user_id': user_id, 'title': 'Prepare viva presentation', 'description': 'Design slides and practice answers for final-year viva', 'priority': 'medium', 'due_date': datetime.utcnow() + timedelta(days=3), 'is_done': False, 'pomodoro_sessions': 0, 'created_at': datetime.utcnow()},
    {'user_id': user_id, 'title': 'Research AI-based cognitive support', 'description': 'Read research papers on assistive technologies', 'priority': 'low', 'due_date': datetime.utcnow() + timedelta(days=5), 'is_done': True, 'pomodoro_sessions': 2, 'created_at': datetime.utcnow()}
]
db.tasks.insert_many(tasks)

journals = [
    {'user_id': user_id, 'text': 'Feeling productive and calm today while organizing my project tasks.', 'sentiment': 'positive', 'sentiment_score': 0.91, 'tags': ['productive','calm','tasks'], 'created_at': datetime.utcnow() - timedelta(days=1)},
    {'user_id': user_id, 'text': 'A bit distracted today but making steady progress.', 'sentiment': 'neutral', 'sentiment_score': 0.55, 'tags': ['distracted','progress'], 'created_at': datetime.utcnow() - timedelta(days=2)},
    {'user_id': user_id, 'text': 'Feeling stressed due to upcoming deadlines and too many tasks.', 'sentiment': 'negative', 'sentiment_score': 0.87, 'tags': ['stressed','deadlines','tasks'], 'created_at': datetime.utcnow() - timedelta(days=3)}
]
db.journals.insert_many(journals)

