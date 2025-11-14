# FocusMate backend (offline-ready)
import os
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

def simple_sentiment(text: str):
    t = (text or "").lower()
    positives = ["good","happy","calm","focused","relaxed","motivated","great","productive"]
    negatives = ["sad","anxious","stressed","overwhelmed","panic","depressed","tired","distracted"]
    score = 0
    for p in positives:
        if p in t: score += 1
    for n in negatives:
        if n in t: score -= 1
    if score > 0: return "positive", min(score/5.0, 1.0)
    if score < 0: return "negative", min(abs(score)/5.0, 1.0)
    return "neutral", 0.0

def analyze_sentiment(text: str):
    return simple_sentiment(text)

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret')
CORS(app, supports_credentials=True)

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/focusmate')
client = MongoClient(MONGO_URI)
db = client.get_database()

def require_user():
    uid = session.get('user_id')
    if not uid: return None
    try: return db.users.find_one({'_id': ObjectId(uid)})
    except: return None

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    email = data.get('email'); password = data.get('password'); name = data.get('name','')
    if not email or not password: return jsonify({'error':'email and password required'}), 400
    if db.users.find_one({'email': email}): return jsonify({'error':'user exists'}), 400
    user = {'email': email, 'name': name, 'password_hash': generate_password_hash(password), 'created_at': datetime.utcnow()}
    db.users.insert_one(user)
    return jsonify({'message':'registered'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email'); password = data.get('password')
    user = db.users.find_one({'email': email})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error':'invalid credentials'}), 401
    session['user_id'] = str(user['_id'])
    return jsonify({'message':'login successful', 'user': {'email': user['email'], 'name': user.get('name','')}})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message':'logged out'})

@app.route('/api/tasks', methods=['GET','POST'])
def tasks():
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    if request.method == 'GET':
        docs = list(db.tasks.find({'user_id': user['_id']}).sort('created_at', -1))
        out = []
        for d in docs:
            out.append({'_id': str(d.get('_id')), 'title': d.get('title'), 'description': d.get('description'), 'priority': d.get('priority'), 'is_done': d.get('is_done', False),'pomodoro_sessions': d.get('pomodoro_sessions',0)})
        return jsonify(out)
    data = request.json or {}
    task = {'user_id': user['_id'], 'title': data.get('title',''), 'description': data.get('description',''), 'priority': data.get('priority','medium'), 'is_done': False, 'pomodoro_sessions': 0, 'created_at': datetime.utcnow()}
    res = db.tasks.insert_one(task)
    task['_id'] = str(res.inserted_id)
    return jsonify(task), 201

@app.route('/api/tasks/<task_id>/done', methods=['PUT'])
def mark_done(task_id):
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    res = db.tasks.update_one({'_id': ObjectId(task_id), 'user_id': user['_id']}, {'': {'is_done': True}, '': {'pomodoro_sessions': 1}})
    if res.matched_count == 0: return jsonify({'error':'task not found'}), 404
    return jsonify({'message':'task marked done'})

@app.route('/api/journal', methods=['POST'])
def add_journal():
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    data = request.json or {}; text = data.get('text','').strip()
    if not text: return jsonify({'error':'text required'}), 400
    sentiment_label, score = analyze_sentiment(text)
    tags = list({w.strip('.,!?:;').lower() for w in text.split() if len(w) > 3})[:6]
    entry = {'user_id': user['_id'], 'text': text, 'sentiment': sentiment_label, 'sentiment_score': float(score), 'tags': tags, 'created_at': datetime.utcnow()}
    res = db.journals.insert_one(entry)
    entry['_id'] = str(res.inserted_id)
    return jsonify(entry), 201

@app.route('/api/journal', methods=['GET'])
def get_journals():
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    limit = int(request.args.get('limit', 10)); docs = list(db.journals.find({'user_id': user['_id']}).sort('created_at', -1).limit(limit))
    out = []
    for d in docs:
        out.append({'_id': str(d.get('_id')), 'text': d.get('text'), 'sentiment': d.get('sentiment'), 'sentiment_score': d.get('sentiment_score'), 'tags': d.get('tags', []), 'created_at': d.get('created_at')})
    return jsonify(out)

@app.route('/api/suggestions', methods=['GET'])
def suggestions_route():
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    last = list(db.journals.find({'user_id': user['_id']}).sort('created_at', -1).limit(1))
    mood = last[0]['sentiment'] if last else 'neutral'
    score = float(last[0].get('sentiment_score', 0.0)) if last else 0.0
    high_pending = db.tasks.count_documents({'user_id': user['_id'], 'is_done': False, 'priority': 'high'})
    suggestions = []
    if mood == 'negative':
        suggestions.append({'text': 'Take a 5-minute breathing break', 'priority': 'high'})
        suggestions.append({'text': 'Go for a short walk', 'priority': 'medium'})
    elif mood == 'positive':
        suggestions.append({'text': 'Start a 25-minute focused session', 'priority': 'high'})
    else:
        suggestions.append({'text': 'Try a short 15-minute focus session', 'priority': 'medium'})
    if high_pending >= 3:
        suggestions.append({'text': f'Break {high_pending} high-priority tasks into 10-minute chunks', 'priority': 'high'})
    return jsonify({'mood': mood, 'suggestions': suggestions})

@app.route('/api/stats', methods=['GET'])
def stats_route():
    user = require_user()
    if not user: return jsonify({'error':'unauthenticated'}), 401
    done = db.tasks.count_documents({'user_id': user['_id'], 'is_done': True}); total = db.tasks.count_documents({'user_id': user['_id']})
    recent = list(db.journals.find({'user_id': user['_id']}).sort('created_at', -1).limit(7))
    mood_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
    for j in recent: mood_counts[j.get('sentiment', 'neutral')] = mood_counts.get(j.get('sentiment', 'neutral'), 0) + 1
    return jsonify({'tasks_done': done, 'tasks_total': total, 'recent_mood': mood_counts})

if __name__ == '__main__':
    print('Starting FocusMate backend (offline-ready)...')
    app.run(debug=True, port=5000)
