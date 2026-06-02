from flask import Flask, request, jsonify
import psycopg2
import os
from flask_cors import CORS

app = Flask(__name__)
# CORS allows your Nginx HTML page to securely send data to this Python API
CORS(app)

# Pull database credentials from the Docker environment variables
DB_USER = os.getenv("POSTGRES_USER", "cisco_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "Password123!")
DB_NAME = os.getenv("POSTGRES_DB", "cisco_architecture")
DB_HOST = os.getenv("DB_HOST", "db")

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

# This function runs once on startup to ensure the database table exists
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            requester VARCHAR(100),
            email VARCHAR(100),
            severity VARCHAR(20),
            category VARCHAR(50),
            description TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

# The Route that catches the JSON payload from your HTML form
@app.route('/api/ticket', methods=['POST'])
def create_ticket():
    data = request.json
    print(f"Received ticket from {data['requester']}", flush=True)
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO tickets (requester, email, severity, category, description) VALUES (%s, %s, %s, %s, %s)',
        (data['requester'], data['email'], data['severity'], data['category'], data['description'])
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"status": "success", "message": "Ticket successfully routed to PostgreSQL!"}), 201

if __name__ == '__main__':
    init_db()
    # Listen on all IP addresses on port 5000
    app.run(host='0.0.0.0', port=5000)