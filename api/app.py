import os
import time
import datetime
import bcrypt
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceError
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)
CORS(app)

REQUEST_COUNT = Counter(
    'cisco_api_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = Histogram(
    'cisco_api_request_latency_seconds',
    'Request latency in seconds',
    ['method', 'endpoint']
)
SF_CALL_COUNT = Counter(
    'cisco_sf_calls_total',
    'Total Salesforce API calls',
    ['operation', 'status']
)
SF_CALL_LATENCY = Histogram(
    'cisco_sf_call_latency_seconds',
    'Salesforce API call latency in seconds',
    ['operation']
)
DB_CALL_LATENCY = Histogram(
    'cisco_db_query_latency_seconds',
    'PostgreSQL query latency in seconds',
    ['operation']
)
 
# ── Before/after request hooks — auto-instruments EVERY route ──
@app.before_request
def _start_timer():
    request._prom_start_time = time.time()
 
@app.after_request
def _record_request_metrics(response):
    if hasattr(request, '_prom_start_time'):
        latency = time.time() - request._prom_start_time
        endpoint = request.endpoint or 'unmatched'
        REQUEST_LATENCY.labels(method=request.method, endpoint=endpoint).observe(latency)
        REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status=response.status_code).inc()
    return response
 
# ── Metrics scrape endpoint — this is what Prometheus hits ──
@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}
 
 
# ══════════════════════════════════════════════════════════════
# OPTIONAL — wrap Salesforce calls to track SF-specific latency.
# Use like:   with sf_timer('create_case'): sf.Case.create({...})
# Drop this near your get_sf() function.
# ══════════════════════════════════════════════════════════════
from contextlib import contextmanager
 
@contextmanager
def sf_timer(operation):
    start = time.time()
    status = 'success'
    try:
        yield
    except Exception:
        status = 'error'
        raise
    finally:
        SF_CALL_LATENCY.labels(operation=operation).observe(time.time() - start)
        SF_CALL_COUNT.labels(operation=operation, status=status).inc()
 
# Example usage inside an existing route:
#
#   with sf_timer('create_case'):
#       case = sf.Case.create({...})
#
# This is optional polish — the before/after request hooks above
# already give you per-endpoint latency/error rate for free,
# without touching a single existing route.

SECRET_KEY        = os.getenv("FLASK_SECRET_KEY", "cisco-dev-secret")
DB_USER           = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS           = os.getenv("POSTGRES_PASSWORD", "Password123!")
DB_NAME           = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST           = os.getenv("DB_HOST", "db")
SF_CLIENT_ID      = os.getenv("SF_CLIENT_ID", "")
SF_CLIENT_SECRET  = os.getenv("SF_CLIENT_SECRET", "")
SF_USERNAME       = os.getenv("SF_USERNAME", "")
SF_PASSWORD_TOKEN = os.getenv("SF_PASSWORD_TOKEN", "")

# ── DB ───────────────────────────────────────────────
def get_db():
    return psycopg2.connect(
        host=DB_HOST, database=DB_NAME,
        user=DB_USER, password=DB_PASS
    )

def init_db():
    retries = 5
    while retries:
        try:
            conn = get_db()
            cur = conn.cursor()
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
                CREATE TABLE IF NOT EXISTS accounts (
                    id SERIAL PRIMARY KEY,
                    company_name VARCHAR(100) NOT NULL,
                    sf_account_id VARCHAR(50) DEFAULT '',
                    plan VARCHAR(20) DEFAULT 'standard',
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                    full_name VARCHAR(100) NOT NULL,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'viewer',
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS case_studies (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    client VARCHAR(100),
                    summary TEXT, outcome TEXT, badge VARCHAR(50),
                    published BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # Default admin
            pw = bcrypt.hashpw(b'CiscoAdmin123!', bcrypt.gensalt(12)).decode()
            cur.execute('''
                INSERT INTO agents (full_name,username,email,password_hash,role)
                SELECT 'System Administrator','admin',
                       'admin@ciscotechnologies.com',%s,'admin'
                WHERE NOT EXISTS (SELECT 1 FROM agents WHERE username='admin');
            ''', (pw,))

            # Seed case study
            cur.execute('''
                INSERT INTO case_studies (title,client,summary,outcome,badge)
                SELECT 'Avaya to Cisco Migration','Financial Services Co.',
                       'Full UC migration from Avaya to Cisco Webex Calling.',
                       'Reduced telephony costs by 40%%','badge-blue'
                WHERE NOT EXISTS (SELECT 1 FROM case_studies LIMIT 1);
            ''')

            conn.commit(); cur.close(); conn.close()
            print("✅ DB initialized")
            return
        except Exception as e:
            print(f"DB not ready: {e}")
            retries -= 1
            time.sleep(3)

# ── Salesforce ───────────────────────────────────────
def get_sf():
    try:
        return Salesforce(
            username=SF_USERNAME,
            password=SF_PASSWORD_TOKEN,
            consumer_key=SF_CLIENT_ID,
            consumer_secret=SF_CLIENT_SECRET,
            domain='login'
        )
    except Exception as e:
        print(f"SF failed: {e}")
        return None

# ── Auth decorators ──────────────────────────────────
def agent_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization','').replace('Bearer ','')
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if payload.get('type') != 'agent':
                return jsonify({"error": "Agent access required"}), 403
            request.agent = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_agent_required(f):
    @wraps(f)
    @agent_required
    def decorated(*args, **kwargs):
        if request.agent.get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

def customer_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization','').replace('Bearer ','')
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if payload.get('type') != 'customer':
                return jsonify({"error": "Customer access required"}), 403
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

# ── Health ───────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

# ═══════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    username = data.get('username','').strip()
    password = data.get('password','').encode()
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400
    conn = get_db(); cur = conn.cursor()
    cur.execute(
        'SELECT id,full_name,username,email,password_hash,role,active FROM agents WHERE username=%s',
        (username,)
    )
    agent = cur.fetchone(); cur.close(); conn.close()
    if not agent:
        return jsonify({"error": "Invalid credentials"}), 401
    id,full_name,uname,email,pw_hash,role,active = agent
    if not active:
        return jsonify({"error": "Account disabled"}), 401
    if not bcrypt.checkpw(password, pw_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({
        "id": id, "username": uname, "full_name": full_name,
        "email": email, "role": role, "type": "agent",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "user": {
        "id": id, "full_name": full_name, "username": uname,
        "email": email, "role": role
    }}), 200

@app.route('/api/support/login', methods=['POST'])
def support_login():
    data = request.json or {}
    username = data.get('username','').strip()
    password = data.get('password','').encode()
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400
    conn = get_db(); cur = conn.cursor()
    cur.execute('''
        SELECT u.id,u.full_name,u.username,u.email,u.password_hash,
               u.role,u.active,u.account_id,a.company_name,a.sf_account_id
        FROM users u
        JOIN accounts a ON a.id = u.account_id
        WHERE u.username=%s AND u.active=TRUE AND a.active=TRUE
    ''', (username,))
    user = cur.fetchone(); cur.close(); conn.close()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    id,full_name,uname,email,pw_hash,role,active,acc_id,company,sf_acc_id = user
    if not bcrypt.checkpw(password, pw_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({
        "id": id, "username": uname, "full_name": full_name,
        "email": email, "role": role, "type": "customer",
        "account_id": acc_id, "company": company,
        "sf_account_id": sf_acc_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "user": {
        "id": id, "full_name": full_name, "username": uname,
        "email": email, "role": role, "company": company,
        "account_id": acc_id
    }}), 200

# ═══════════════════════════════════════════════════════
# ADMIN — ACCOUNT MANAGEMENT
# ═══════════════════════════════════════════════════════

@app.route('/api/admin/accounts', methods=['GET'])
@agent_required
def get_accounts():
    conn = get_db(); cur = conn.cursor()
    cur.execute('''
        SELECT a.id, a.company_name, a.sf_account_id, a.plan,
               a.active, a.created_at,
               COUNT(u.id) as user_count
        FROM accounts a
        LEFT JOIN users u ON u.account_id = a.id
        GROUP BY a.id ORDER BY a.created_at DESC
    ''')
    rows = cur.fetchall(); cur.close(); conn.close()
    keys = ["id","company_name","sf_account_id","plan","active","created_at","user_count"]
    return jsonify([dict(zip(keys,r)) for r in rows]), 200

@app.route('/api/admin/accounts', methods=['POST'])
@admin_agent_required
def create_account():
    data = request.json or {}
    if not data.get('company_name'):
        return jsonify({"error": "Company name required"}), 400

    # Create Account in Salesforce too
    sf_account_id = ''
    try:
        sf = get_sf()
        if sf:
            result = sf.Account.create({
                'Name': data['company_name'],
                'Type': 'Customer',
                'Description': data.get('description',''),
                'Phone': data.get('phone','')
            })
            sf_account_id = result.get('id','')
    except Exception as e:
        print(f"SF Account creation failed: {e}")

    conn = get_db(); cur = conn.cursor()
    cur.execute(
        'INSERT INTO accounts (company_name,sf_account_id,plan) VALUES (%s,%s,%s) RETURNING id',
        (data['company_name'], sf_account_id, data.get('plan','standard'))
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return jsonify({"id": new_id, "sf_account_id": sf_account_id}), 201

@app.route('/api/admin/accounts/<int:account_id>', methods=['PUT'])
@admin_agent_required
def update_account(account_id):
    data = request.json or {}
    conn = get_db(); cur = conn.cursor()
    cur.execute(
        'UPDATE accounts SET company_name=%s, plan=%s, active=%s WHERE id=%s',
        (data['company_name'], data.get('plan','standard'), data.get('active',True), account_id)
    )
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/accounts/<int:account_id>', methods=['DELETE'])
@admin_agent_required
def delete_account(account_id):
    conn = get_db(); cur = conn.cursor()
    cur.execute('DELETE FROM accounts WHERE id=%s', (account_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

# ═══════════════════════════════════════════════════════
# ADMIN — USER MANAGEMENT UNDER ACCOUNTS
# ═══════════════════════════════════════════════════════

@app.route('/api/admin/accounts/<int:account_id>/users', methods=['GET'])
@agent_required
def get_account_users(account_id):
    conn = get_db(); cur = conn.cursor()
    cur.execute('''
        SELECT id,full_name,username,email,role,active,created_at
        FROM users WHERE account_id=%s ORDER BY created_at DESC
    ''', (account_id,))
    rows = cur.fetchall(); cur.close(); conn.close()
    keys = ["id","full_name","username","email","role","active","created_at"]
    return jsonify([dict(zip(keys,r)) for r in rows]), 200

@app.route('/api/admin/accounts/<int:account_id>/users', methods=['POST'])
@agent_required
def create_user(account_id):
    data = request.json or {}
    required = ['full_name','username','email','password','role']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    pw_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt(12)).decode()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            '''INSERT INTO users (account_id,full_name,username,email,password_hash,role)
               VALUES (%s,%s,%s,%s,%s,%s) RETURNING id''',
            (account_id, data['full_name'], data['username'],
             data['email'], pw_hash, data['role'])
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({"error": "Username or email already exists"}), 409
    cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@agent_required
def update_user(user_id):
    data = request.json or {}
    conn = get_db(); cur = conn.cursor()
    if data.get('password'):
        pw_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt(12)).decode()
        cur.execute(
            'UPDATE users SET full_name=%s,email=%s,role=%s,active=%s,password_hash=%s WHERE id=%s',
            (data['full_name'],data['email'],data['role'],data.get('active',True),pw_hash,user_id)
        )
    else:
        cur.execute(
            'UPDATE users SET full_name=%s,email=%s,role=%s,active=%s WHERE id=%s',
            (data['full_name'],data['email'],data['role'],data.get('active',True),user_id)
        )
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@agent_required
def delete_user(user_id):
    conn = get_db(); cur = conn.cursor()
    cur.execute('DELETE FROM users WHERE id=%s', (user_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

# ═══════════════════════════════════════════════════════
# ADMIN — INTERNAL AGENT MANAGEMENT
# ═══════════════════════════════════════════════════════

@app.route('/api/admin/agents', methods=['GET'])
@admin_agent_required
def get_agents():
    conn = get_db(); cur = conn.cursor()
    cur.execute('SELECT id,full_name,username,email,role,active,created_at FROM agents ORDER BY created_at DESC')
    rows = cur.fetchall(); cur.close(); conn.close()
    keys = ["id","full_name","username","email","role","active","created_at"]
    return jsonify([dict(zip(keys,r)) for r in rows]), 200

@app.route('/api/admin/agents', methods=['POST'])
@admin_agent_required
def create_agent():
    data = request.json or {}
    required = ['full_name','username','email','password','role']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    pw_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt(12)).decode()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            'INSERT INTO agents (full_name,username,email,password_hash,role) VALUES (%s,%s,%s,%s,%s) RETURNING id',
            (data['full_name'],data['username'],data['email'],pw_hash,data['role'])
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({"error": "Username or email exists"}), 409
    cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route('/api/admin/agents/<int:agent_id>', methods=['PUT'])
@admin_agent_required
def update_agent(agent_id):
    data = request.json or {}
    conn = get_db(); cur = conn.cursor()
    if data.get('password'):
        pw_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt(12)).decode()
        cur.execute(
            'UPDATE agents SET full_name=%s,email=%s,role=%s,active=%s,password_hash=%s WHERE id=%s',
            (data['full_name'],data['email'],data['role'],data.get('active',True),pw_hash,agent_id)
        )
    else:
        cur.execute(
            'UPDATE agents SET full_name=%s,email=%s,role=%s,active=%s WHERE id=%s',
            (data['full_name'],data['email'],data['role'],data.get('active',True),agent_id)
        )
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/agents/<int:agent_id>', methods=['DELETE'])
@admin_agent_required
def delete_agent(agent_id):
    if request.agent.get('id') == agent_id:
        return jsonify({"error": "Cannot delete yourself"}), 400
    conn = get_db(); cur = conn.cursor()
    cur.execute('DELETE FROM agents WHERE id=%s', (agent_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

# ═══════════════════════════════════════════════════════
# ADMIN — CASE STUDIES
# ═══════════════════════════════════════════════════════

@app.route('/api/case-studies', methods=['GET'])
def get_case_studies():
    conn = get_db(); cur = conn.cursor()
    cur.execute('SELECT id,title,client,summary,outcome,badge FROM case_studies WHERE published=TRUE ORDER BY created_at DESC')
    rows = cur.fetchall(); cur.close(); conn.close()
    keys = ["id","title","client","summary","outcome","badge"]
    return jsonify([dict(zip(keys,r)) for r in rows]), 200

@app.route('/api/admin/case-studies', methods=['GET'])
@agent_required
def admin_get_case_studies():
    conn = get_db(); cur = conn.cursor()
    cur.execute('SELECT id,title,client,summary,outcome,badge,published FROM case_studies ORDER BY created_at DESC')
    rows = cur.fetchall(); cur.close(); conn.close()
    keys = ["id","title","client","summary","outcome","badge","published"]
    return jsonify([dict(zip(keys,r)) for r in rows]), 200

@app.route('/api/admin/case-studies', methods=['POST'])
@agent_required
def create_case_study():
    data = request.json or {}
    conn = get_db(); cur = conn.cursor()
    cur.execute(
        'INSERT INTO case_studies (title,client,summary,outcome,badge) VALUES (%s,%s,%s,%s,%s) RETURNING id',
        (data['title'],data['client'],data['summary'],data['outcome'],data.get('badge','badge-blue'))
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return jsonify({"id": new_id}), 201

@app.route('/api/admin/case-studies/<int:id>', methods=['PUT'])
@agent_required
def update_case_study(id):
    data = request.json or {}
    conn = get_db(); cur = conn.cursor()
    cur.execute(
        'UPDATE case_studies SET title=%s,client=%s,summary=%s,outcome=%s,badge=%s WHERE id=%s',
        (data['title'],data['client'],data['summary'],data['outcome'],data['badge'],id)
    )
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Updated"}), 200

@app.route('/api/admin/case-studies/<int:id>', methods=['DELETE'])
@agent_required
def delete_case_study(id):
    conn = get_db(); cur = conn.cursor()
    cur.execute('DELETE FROM case_studies WHERE id=%s', (id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({"message": "Deleted"}), 200

# ═══════════════════════════════════════════════════════
# ADMIN — TICKET OVERVIEW (reads from Salesforce)
# ═══════════════════════════════════════════════════════

@app.route('/api/admin/tickets', methods=['GET'])
@agent_required
def admin_get_tickets():
    try:
        sf = get_sf()
        if not sf:
            return jsonify({"error": "SF connection failed"}), 503
        result = sf.query('''
            SELECT Id, Ticket_Number__c, Subject, Description,
                   Status, Priority, CreatedDate,
                   Account.Name, Contact.Name, Contact.Email
            FROM Case
            ORDER BY CreatedDate DESC
            LIMIT 200
        ''')
        cases = []
        for r in result['records']:
            cases.append({
                "sf_id": r['Id'],
                "ticket_number": r.get('Ticket_Number__c',''),
                "subject": r.get('Subject',''),
                "description": r.get('Description',''),
                "status": r.get('Status',''),
                "priority": r.get('Priority',''),
                "created": r.get('CreatedDate',''),
                "company": r['Account']['Name'] if r.get('Account') else '',
                "contact_name": r['Contact']['Name'] if r.get('Contact') else '',
                "contact_email": r['Contact']['Email'] if r.get('Contact') else '',
            })
        return jsonify(cases), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ═══════════════════════════════════════════════════════
# SUPPORT PORTAL — CUSTOMER FACING
# ═══════════════════════════════════════════════════════

@app.route('/api/support/tickets', methods=['GET'])
@customer_required
def get_customer_tickets():
    sf_account_id = request.user.get('sf_account_id','')
    if not sf_account_id:
        return jsonify([]), 200
    try:
        sf = get_sf()
        if not sf:
            return jsonify({"error": "SF unavailable"}), 503
        result = sf.query(f'''
            SELECT Id, Ticket_Number__c, Subject,
                   Description, Status, Priority, CreatedDate,
                   Contact.Name
            FROM Case
            WHERE AccountId = '{sf_account_id}'
            ORDER BY CreatedDate DESC
        ''')
        cases = []
        for r in result['records']:
            cases.append({
                "sf_id": r['Id'],
                "ticket_number": r.get('Ticket_Number__c',''),
                "subject": r.get('Subject',''),
                "description": r.get('Description',''),
                "status": r.get('Status',''),
                "priority": r.get('Priority',''),
                "created": r.get('CreatedDate',''),
                "contact": r['Contact']['Name'] if r.get('Contact') else '',
            })
        return jsonify(cases), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/support/tickets', methods=['POST'])
@customer_required
def create_customer_ticket():
    data = request.json or {}
    required = ['subject','description','priority']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    user = request.user
    try:
        sf = get_sf()
        if not sf:
            return jsonify({"error": "SF unavailable"}), 503

        # Find or create Contact in SF for this user
        contact_result = sf.query(f'''
            SELECT Id FROM Contact
            WHERE Email = '{user["email"]}'
            LIMIT 1
        ''')
        if contact_result['records']:
            contact_id = contact_result['records'][0]['Id']
        else:
            new_contact = sf.Contact.create({
                'FirstName': user['full_name'].split()[0],
                'LastName': user['full_name'].split()[-1],
                'Email': user['email'],
                'AccountId': user['sf_account_id']
            })
            contact_id = new_contact['id']

        # Create Case
        case = sf.Case.create({
            'Subject': data['subject'],
            'Description': data['description'],
            'Priority': data['priority'],
            'Status': 'New',
            'Origin': 'Web',
            'AccountId': user['sf_account_id'],
            'ContactId': contact_id
        })
        return jsonify({
            "sf_id": case['id'],
            "message": "Ticket created successfully"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/support/tickets/<sf_case_id>', methods=['GET'])
@customer_required
def get_ticket_detail(sf_case_id):
    sf_account_id = request.user.get('sf_account_id','')
    try:
        sf = get_sf()
        if not sf:
            return jsonify({"error": "SF unavailable"}), 503

        # Get case (verify it belongs to this account)
        result = sf.query(f'''
            SELECT Id, Ticket_Number__c, Subject, Description,
                   Status, Priority, CreatedDate, AccountId,
                   Contact.Name, Contact.Email
            FROM Case
            WHERE Id = '{sf_case_id}' AND AccountId = '{sf_account_id}'
        ''')
        if not result['records']:
            return jsonify({"error": "Not found"}), 404

        case = result['records'][0]

        # Get comments
        comments_result = sf.query(f'''
            SELECT Id, CommentBody, CreatedDate, CreatedBy.Name, IsPublished
            FROM CaseComment
            WHERE ParentId = '{sf_case_id}' AND IsPublished = TRUE
            ORDER BY CreatedDate ASC
        ''')
        comments = [{
            "id": c['Id'],
            "body": c['CommentBody'],
            "created": c['CreatedDate'],
            "author": c['CreatedBy']['Name'],
            "public": c['IsPublished']
        } for c in comments_result['records']]

        return jsonify({
            "sf_id": case['Id'],
            "ticket_number": case.get('Ticket_Number__c',''),
            "subject": case.get('Subject',''),
            "description": case.get('Description',''),
            "status": case.get('Status',''),
            "priority": case.get('Priority',''),
            "created": case.get('CreatedDate',''),
            "contact_name": case['Contact']['Name'] if case.get('Contact') else '',
            "comments": comments
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Marketing contact form → SF Lead ─────────────────
@app.route('/api/contact', methods=['POST'])
def create_lead():
    data = request.json or {}
    required = ['name','email','company','message']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    parts = data['name'].strip().split(' ',1)
    try:
        sf = get_sf()
        if sf:
            sf.Lead.create({
                'FirstName': parts[0],
                'LastName': parts[1] if len(parts)>1 else parts[0],
                'Email': data['email'],
                'Company': data['company'],
                'Phone': data.get('phone',''),
                'Description': data['message'],
                'LeadSource': 'Website - Contact Form'
            })
    except Exception as e:
        print(f"Lead error: {e}")
    return jsonify({"status": "success"}), 201

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)