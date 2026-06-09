CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    requester VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    notes TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS case_studies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    client VARCHAR(100),
    summary TEXT,
    outcome TEXT,
    badge VARCHAR(50),
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Default admin (password: CiscoAdmin123!)
-- Hash generated with bcrypt rounds=12
INSERT INTO agents (full_name, username, email, password_hash, role)
SELECT
    'System Administrator',
    'admin',
    'admin@ciscotechnologies.com',
    '$2b$12$kd1qe2MmSfkVHJgY4L7dQeCKbs5AMfQsYOefycWGndF8unRbgBQRy',
    'admin'
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE username = 'admin');

-- Seed case studies
INSERT INTO case_studies (title, client, summary, outcome, badge)
SELECT 'Avaya to Cisco Migration', 'Financial Services Co.',
       'Full UC migration from Avaya to Cisco Webex Calling across 3 sites.',
       'Reduced telephony costs by 40%', 'badge-blue'
WHERE NOT EXISTS (SELECT 1 FROM case_studies LIMIT 1);