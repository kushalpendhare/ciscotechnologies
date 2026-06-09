import time
import os
import jwt
import datetime
import bcrypt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "fallback-dev-key")
DB_USER    = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS    = os.getenv("POSTGRES_PASSWORD", "Password123!")
DB_NAME    = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST    = os.getenv("DB_HOST", "db")

# ── DB ──────────────────────────────────────────────
def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, database=DB_NAME,
        user=DB_USER, password=DB_PASS
    )

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
                    notes TEXT DEFAULT '',
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

            cur.execute('''
                CREATE TABLE IF NOT EXISTS agents (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(100) NOT NULL,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'agent',
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # Add notes column if upgrading existing DB
            cur.execute('''
                ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
            ''')

            # Default admin account
            default_hash = bcrypt.hashpw(
                b'CiscoAdmin123!',
                bcrypt.gensalt(rounds=12)
            ).decode('utf-8')

            cur.execute('''
                INSERT INTO agents (full_name, username, email, password_hash, role)
                SELECT 'System Administrator', 'admin',
                       'admin@ciscotechnologies.com', %s, 'admin'
                WHERE NOT EXISTS (SELECT 1 FROM agents WHERE username = 'admin');
            ''', (default_hash,))

            conn.commit()
            cur.close()
            conn.close()
            print("✅ Database initialized")
            return
        except Exception as e:
            print(f"DB not ready, retrying... ({e})")
            retries -= 1
            time.sleep(3)

# ── AUTH ────────────────────────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"status": "error", "message": "Token missing"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.agent = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.agent.get('role') != 'admin':
            return jsonify({"status": "error", "message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

def agent_or_admin(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.agent.get('role') not in ['admin', 'agent']:
            return jsonify({"status": "error", "message": "Agent access required"}), 403
        return f(*args, **kwargs)
    return decorated

# ── HEALTH ──────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "cisco-api"}), 200

# ── LOGIN ────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').encode('utf-8')

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'SELECT id, full_name, username, email, password_hash, role, active FROM agents WHERE username=%s',
        (username,)
    )
    agent = cur.fetchone()
    cur.close()
    conn.close()

    if not agent:
        return jsonify({"status": "unauthorized", "message": "Invalid credentials"}), 401

    agent_id, full_name, uname, email, pw_hash, role, active = agent

    if not active:
        return jsonify({"status": "unauthorized", "message": "Account disabled"}), 401

    if not bcrypt.checkpw(password, pw_hash.encode('utf-8')):
        return jsonify({"status": "unauthorized", "message": "Invalid credentials"}), 401

    token = jwt.encode({
        "id": agent_id,
        "user": uname,
        "full_name": full_name,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "status": "authenticated",
        "token": token,
        "user": {"id": agent_id, "full_name": full_name, "username": uname, "email": email, "role": role}
    }), 200

# ── TICKETS (public create) ──────────────────────────
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
        (data['requester'], data['email'], data['phone'],
         data['severity'], data['category'], data['description'], 'Open')
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success", "ticket_id": new_id}), 201

# ── TICKETS (protected) ──────────────────────────────
@app.route('/api/tickets', methods=['GET'])
@token_required
def get_tickets():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT id,requester,email,phone,severity,category,
               description,status,notes,timestamp
        FROM tickets ORDER BY timestamp DESC
    ''')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","requester","email","phone","severity",
            "category","description","status","notes","timestamp"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

@app.route('/api/ticket/<int:ticket_id>', methods=['PUT'])
@token_required
def update_ticket(ticket_id):
    data = request.json or {}
    new_status = data.get('status')
    notes = data.get('notes')
    if not new_status:
        return jsonify({"status": "error", "message": "Status required"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    if notes is not None:
        cur.execute(
            'UPDATE tickets SET status=%s, notes=%s WHERE id=%s',
            (new_status, notes, ticket_id)
        )
    else:
        cur.execute('UPDATE tickets SET status=%s WHERE id=%s', (new_status, ticket_id))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success"}), 200

@app.route('/api/ticket/<int:ticket_id>', methods=['DELETE'])
@admin_required
def delete_ticket(ticket_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM tickets WHERE id=%s', (ticket_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"status": "success"}), 200

# ── CASE STUDIES (public) ────────────────────────────
@app.route('/api/case-studies', methods=['GET'])
def get_case_studies():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT id,title,client,summary,outcome,badge
        FROM case_studies WHERE published=TRUE
        ORDER BY created_at DESC
    ''')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","title","client","summary","outcome","badge"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

# ── CASE STUDIES (admin) ─────────────────────────────
@app.route('/api/admin/case-studies', methods=['GET'])
@token_required
def admin_get_case_studies():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id,title,client,summary,outcome,badge,published FROM case_studies ORDER BY created_at DESC')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","title","client","summary","outcome","badge","published"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

@app.route('/api/admin/case-studies', methods=['POST'])
@agent_or_admin
def create_case_study():
    data = request.json or {}
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO case_studies (title,client,summary,outcome,badge) VALUES (%s,%s,%s,%s,%s) RETURNING id',
        (data['title'], data['client'], data['summary'], data['outcome'], data.get('badge','badge-blue'))
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Created", "id": new_id}), 201

@app.route('/api/admin/case-studies/<int:id>', methods=['PUT'])
@agent_or_admin
def update_case_study(id):
    data = request.json or {}
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'UPDATE case_studies SET title=%s,client=%s,summary=%s,outcome=%s,badge=%s WHERE id=%s',
        (data['title'], data['client'], data['summary'], data['outcome'], data['badge'], id)
    )
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/case-studies/<int:id>', methods=['DELETE'])
@agent_or_admin
def delete_case_study(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM case_studies WHERE id=%s', (id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

# ── AGENTS / USER MANAGEMENT ─────────────────────────
@app.route('/api/admin/agents', methods=['GET'])
@admin_required
def get_agents():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, full_name, username, email, role, active, created_at
        FROM agents ORDER BY created_at DESC
    ''')
    rows = cur.fetchall()
    cur.close(); conn.close()
    keys = ["id","full_name","username","email","role","active","created_at"]
    return jsonify([dict(zip(keys, r)) for r in rows]), 200

@app.route('/api/admin/agents', methods=['POST'])
@admin_required
def create_agent():
    data = request.json or {}
    required = ['full_name', 'username', 'email', 'password', 'role']
    if not all(k in data for k in required):
        return jsonify({"status": "error", "message": "Missing fields"}), 400
    if data['role'] not in ['admin', 'agent', 'viewer']:
        return jsonify({"status": "error", "message": "Invalid role"}), 400

    pw_hash = bcrypt.hashpw(
        data['password'].encode('utf-8'),
        bcrypt.gensalt(rounds=12)
    ).decode('utf-8')

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            'INSERT INTO agents (full_name,username,email,password_hash,role) VALUES (%s,%s,%s,%s,%s) RETURNING id',
            (data['full_name'], data['username'], data['email'], pw_hash, data['role'])
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cur.close(); conn.close()
        return jsonify({"status": "error", "message": "Username or email already exists"}), 409
    cur.close(); conn.close()
    return jsonify({"message": "Agent created", "id": new_id}), 201

@app.route('/api/admin/agents/<int:id>', methods=['PUT'])
@admin_required
def update_agent(id):
    data = request.json or {}
    conn = get_db_connection()
    cur = conn.cursor()

    if data.get('password'):
        pw_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'),
            bcrypt.gensalt(rounds=12)
        ).decode('utf-8')
        cur.execute(
            'UPDATE agents SET full_name=%s, email=%s, role=%s, active=%s, password_hash=%s WHERE id=%s',
            (data['full_name'], data['email'], data['role'], data['active'], pw_hash, id)
        )
    else:
        cur.execute(
            'UPDATE agents SET full_name=%s, email=%s, role=%s, active=%s WHERE id=%s',
            (data['full_name'], data['email'], data['role'], data['active'], id)
        )

    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/agents/<int:id>', methods=['DELETE'])
@admin_required
def delete_agent(id):
    # Prevent deleting yourself
    if request.agent.get('id') == id:
        return jsonify({"status": "error", "message": "Cannot delete your own account"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM agents WHERE id=%s', (id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

@app.route('/api/admin/agents/<int:id>/reset-password', methods=['POST'])
@admin_required
def reset_password(id):
    data = request.json or {}
    new_password = data.get('password')
    if not new_password or len(new_password) < 8:
        return jsonify({"status": "error", "message": "Password must be at least 8 characters"}), 400
    pw_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE agents SET password_hash=%s WHERE id=%s', (pw_hash, id))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Password reset"}), 200

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)