-- ── Internal TAC agents ──────────────────────────────
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

-- ── Customer accounts (companies) ────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    sf_account_id VARCHAR(50) DEFAULT '',
    plan VARCHAR(20) DEFAULT 'standard',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customer users (linked to accounts) ──────────────
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

-- ── Marketing site content ────────────────────────────
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

-- ── Default admin agent ───────────────────────────────
INSERT INTO agents (full_name, username, email, password_hash, role)
SELECT
    'System Administrator',
    'admin',
    'admin@ciscotechnologies.com',
    '$2b$12$kd1qe2MmSfkVHJgY4L7dQeCKbs5AMfQsYOefycWGndF8unRbgBQRy',
    'admin'
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE username = 'admin');

-- ── Seed case study ───────────────────────────────────
INSERT INTO case_studies (title, client, summary, outcome, badge)
SELECT 'Avaya to Cisco Migration', 'Financial Services Co.',
       'Full UC migration from Avaya to Cisco Webex Calling across 3 sites.',
       'Reduced telephony costs by 40%', 'badge-blue'
WHERE NOT EXISTS (SELECT 1 FROM case_studies LIMIT 1);