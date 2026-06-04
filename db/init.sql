CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    requester VARCHAR(100), email VARCHAR(100), phone VARCHAR(20),
    severity VARCHAR(20), category VARCHAR(50), description TEXT,
    status VARCHAR(20) DEFAULT 'Open',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS case_studies (
    id SERIAL PRIMARY KEY, title VARCHAR(200), client VARCHAR(100),
    summary TEXT, outcome TEXT, badge VARCHAR(50),
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);