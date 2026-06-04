import time
import os
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

SECRET_KEY  = os.getenv("FLASK_SECRET_KEY", "fallback-dev-key")
ADMIN_USER  = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASS  = os.getenv("ADMIN_PASSWORD", "CiscoAdmin123!")
DB_USER     = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS     = os.getenv("POSTGRES_PASSWORD", "Password123!")
DB_NAME     = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST     = os.getenv("DB_HOST", "db")

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

def init_db():
    retries = 5
    while retries:
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS tickets (
                    id SERIAL PRIMARY KEY,
                    requester VARCHAR(100), email VARCHAR(100), phone VARCHAR(20),
                    severity VARCHAR(20), category VARCHAR(50), description TEXT,
                    status VARCHAR(20) DEFAULT 'Open',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS case_studies (
                    id SERIAL PRIMARY KEY, title VARCHAR(200), client VARCHAR(100),
                    summary TEXT, outcome TEXT, badge VARCHAR(50),
                    published BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            conn.commit()
            cur.close()
            conn.close()
            print("✅ Database initialized")
            return
        except Exception as e:
            print(f"DB not ready, retrying... ({e})")
            retries -= 1
            time.sleep(3)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"status": "error", "message": "Token missing"}), 401
        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    if data.get('username') == ADMIN_USER and data.get('password') == ADMIN_PASS:
        token = jwt.encode({
            "user": data['username'],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({"status": "authenticated", "token": token}), 200
    return jsonify({"status": "unauthorized", "message": "Invalid credentials"}), 401

@app.route('/api/ticket', methods=['POST'])
def create_ticket():
    data = request.json or {}
    required = ['requester', 'email', 'phone', 'severity', 'category', 'description']
    if not all(k in data for k in required):
        return jsonify({"status": "error", "message": "Missing fields"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO tickets (requester,email,phone,severity,category,description,status) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id',
        (data['requester'], data['email'], data['phone'], data['severity'], data['category'], data['description'], 'Open')
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success", "ticket_id": new_id}), 201

@app.route('/api/tickets', methods=['GET'])
@token_required
def get_tickets():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id,requester,email,phone,severity,category,description,status,timestamp FROM tickets ORDER BY timestamp DESC')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","requester","email","phone","severity","category","description","status","timestamp"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

@app.route('/api/ticket/<int:ticket_id>', methods=['PUT'])
@token_required
def update_ticket(ticket_id):
    data = request.json or {}
    new_status = data.get('status')
    if not new_status:
        return jsonify({"status": "error", "message": "Status required"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE tickets SET status=%s WHERE id=%s', (new_status, ticket_id))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success"}), 200

@app.route('/api/ticket/<int:ticket_id>', methods=['DELETE'])
@token_required
def delete_ticket(ticket_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM tickets WHERE id=%s', (ticket_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success"}), 200

@app.route('/api/case-studies', methods=['GET'])
def get_case_studies():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id,title,client,summary,outcome,badge FROM case_studies WHERE published=TRUE ORDER BY created_at DESC')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","title","client","summary","outcome","badge"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

init_db()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)