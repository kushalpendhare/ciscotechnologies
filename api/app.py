import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceError

app = Flask(__name__)
CORS(app)

DB_USER = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "Password123!")
DB_NAME = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST = os.getenv("DB_HOST", "db")

SF_CLIENT_ID      = os.getenv("SF_CLIENT_ID", "")
SF_CLIENT_SECRET  = os.getenv("SF_CLIENT_SECRET", "")
SF_USERNAME       = os.getenv("SF_USERNAME", "")
SF_PASSWORD_TOKEN = os.getenv("SF_PASSWORD_TOKEN", "")

# ── DB ───────────────────────────────────────────────
def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS case_studies (
            id SERIAL PRIMARY KEY, title VARCHAR(200), client VARCHAR(100),
            summary TEXT, outcome TEXT, badge VARCHAR(50),
            published BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    cur.execute('''
        INSERT INTO case_studies (title, client, summary, outcome, badge)
        SELECT 'Avaya to Cisco Migration', 'Financial Services Co.',
               'Full UC migration from Avaya to Cisco Webex Calling across 3 sites.',
               'Reduced telephony costs by 40%', 'badge-blue'
        WHERE NOT EXISTS (SELECT 1 FROM case_studies LIMIT 1);
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database initialized")

# ── Salesforce ───────────────────────────────────────
def get_sf_connection():
    try:
        return Salesforce(
            username=SF_USERNAME,
            password=SF_PASSWORD_TOKEN,
            consumer_key=SF_CLIENT_ID,
            consumer_secret=SF_CLIENT_SECRET,
            domain='login'
        )
    except Exception as e:
        print(f"SF connection failed: {e}")
        return None

# ── Health ───────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "cisco-api"}), 200

# ── Public case studies (marketing site) ─────────────
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

# ── Contact form → Salesforce Lead ───────────────────
@app.route('/api/contact', methods=['POST'])
def create_lead():
    data = request.json or {}
    required = ['name', 'email', 'company', 'message']
    if not all(k in data for k in required):
        return jsonify({"status": "error", "message": "Missing fields"}), 400

    name_parts = data['name'].strip().split(' ', 1)
    first_name = name_parts[0]
    last_name  = name_parts[1] if len(name_parts) > 1 else first_name

    try:
        sf = get_sf_connection()
        if sf:
            sf.Lead.create({
                'FirstName': first_name,
                'LastName':  last_name,
                'Email':     data['email'],
                'Company':   data['company'],
                'Phone':     data.get('phone', ''),
                'Description': data['message'],
                'LeadSource': 'Website - Contact Form'
            })
    except SalesforceError as e:
        print(f"Lead creation failed: {e}")
        # Don't fail the request — log and move on
    except Exception as e:
        print(f"Unexpected error creating Lead: {e}")

    return jsonify({"status": "success", "message": "Thank you, we'll be in touch shortly."}), 201

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)