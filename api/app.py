from flask import Flask, request, jsonify
import psycopg2
import os
import random
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_USER = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "SuperSecretPassword123!")
DB_NAME = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST = os.getenv("DB_HOST", "db")

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    # Updated Schema: ID is now an Integer, added Phone, added Status
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY,
            requester VARCHAR(100),
            email VARCHAR(100),
            phone VARCHAR(20),
            severity VARCHAR(20),
            category VARCHAR(50),
            description TEXT,
            status VARCHAR(20) DEFAULT 'Open',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

@app.route('/api/ticket', methods=['POST'])
def create_ticket():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Generate a random 5-digit ticket number (e.g., 48291)
    new_ticket_id = random.randint(10000, 99999)
    
    cur.execute(
        'INSERT INTO tickets (id, requester, email, phone, severity, category, description, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
        (new_ticket_id, data['requester'], data['email'], data['phone'], data['severity'], data['category'], data['description'], 'Open')
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"status": "success", "ticket_id": new_ticket_id}), 201

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, requester, email, phone, severity, category, description, status, timestamp FROM tickets ORDER BY timestamp DESC;')
    tickets = cur.fetchall()
    cur.close()
    conn.close()
    
    ticket_list = []
    for t in tickets:
        ticket_list.append({
            "id": t[0], "requester": t[1], "email": t[2], "phone": t[3],
            "severity": t[4], "category": t[5], "description": t[6], "status": t[7], "timestamp": t[8]
        })
        
    return jsonify(ticket_list), 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)