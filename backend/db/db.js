// db.js — Dual database layer: PostgreSQL (cloud) or In-Memory (local dev)
import pg from 'pg';
import config from '../config.js';

let pool = null;

// ── In-Memory Store (used when DATABASE_URL is not set) ─────────────────────
const memoryStore = {
  users: [],
  incidents: [],
  audit_logs: [],
  _idCounters: { users: 100, incidents: 100, audit_logs: 100 }
};

function nextId(table) {
  memoryStore._idCounters[table] = (memoryStore._idCounters[table] || 0) + 1;
  return memoryStore._idCounters[table];
}

const MAX_INCIDENTS = 500;
const MAX_AUDIT_LOGS = 200;

function pruneIncidents() {
  if (memoryStore.incidents.length > MAX_INCIDENTS) {
    memoryStore.incidents.splice(0, memoryStore.incidents.length - MAX_INCIDENTS);
  }
}

function pruneAuditLogs() {
  if (memoryStore.audit_logs.length > MAX_AUDIT_LOGS) {
    memoryStore.audit_logs.splice(0, memoryStore.audit_logs.length - MAX_AUDIT_LOGS);
  }
}

// ── PostgreSQL Setup ────────────────────────────────────────────────────────
if (config.usePostgres) {
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
  });
}

// ── Unified Query Interface ─────────────────────────────────────────────────
const db = {
  /**
   * Execute a SQL-like query. When using PostgreSQL, this runs a real query.
   * When using in-memory, it supports a limited set of operations.
   */
  async query(text, params = []) {
    if (config.usePostgres) {
      return pool.query(text, params);
    }
    // In-memory fallback — handled by specific methods below
    throw new Error(`In-memory mode does not support raw queries: ${text.substring(0, 60)}...`);
  },

  // ── Schema creation (PostgreSQL only) ───────────────────────────────────
  async createTables() {
    if (!config.usePostgres) {
      console.log('[DB] In-memory mode — no tables to create.');
      return;
    }

    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'auditor', 'consumer')),
        full_name VARCHAR(100) NOT NULL,
        title VARCHAR(100) DEFAULT '',
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        parent_corporation VARCHAR(255) DEFAULT 'Independent',
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        text_content TEXT,
        skeptic_score NUMERIC(5, 2) NOT NULL,
        severity VARCHAR(50) CHECK(severity IN ('Low', 'Medium', 'Critical')),
        flag_type VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'Pending' CHECK(status IN ('Pending', 'Verified', 'Rejected')),
        submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(schema);
    console.log('[DB] PostgreSQL tables verified/created.');
  },

  // ── Users ───────────────────────────────────────────────────────────────
  async findUserByEmail(email) {
    if (config.usePostgres) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    }
    return memoryStore.users.find(u => u.email === email) || null;
  },

  async createUser({ email, password_hash, role, full_name, title }) {
    if (config.usePostgres) {
      const res = await pool.query(
        'INSERT INTO users (email, password_hash, role, full_name, title) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING RETURNING *',
        [email, password_hash, role, full_name, title || '']
      );
      return res.rows[0];
    }
    // In-memory
    const existing = memoryStore.users.find(u => u.email === email);
    if (existing) return existing;
    const user = { id: nextId('users'), email, password_hash, role, full_name, title: title || '', reset_token: null, reset_token_expires: null, created_at: new Date().toISOString() };
    memoryStore.users.push(user);
    return user;
  },

  async savePasswordResetToken(email, token, expires) {
    if (config.usePostgres) {
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
        [token, expires, email]
      );
      return;
    }
    const user = memoryStore.users.find(u => u.email === email);
    if (user) {
      user.reset_token = token;
      user.reset_token_expires = expires;
    }
  },

  async findUserByResetToken(token) {
    if (config.usePostgres) {
      const res = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
      return res.rows[0] || null;
    }
    const user = memoryStore.users.find(u => u.reset_token === token && new Date(u.reset_token_expires) > new Date());
    return user || null;
  },

  async updatePasswordAndClearToken(userId, newPasswordHash) {
    if (config.usePostgres) {
      await pool.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [newPasswordHash, userId]
      );
      return;
    }
    const user = memoryStore.users.find(u => u.id === userId);
    if (user) {
      user.password_hash = newPasswordHash;
      user.reset_token = null;
      user.reset_token_expires = null;
    }
  },

  // ── Incidents ───────────────────────────────────────────────────────────
  async getAllIncidents() {
    if (config.usePostgres) {
      const res = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
      return res.rows;
    }
    return [...memoryStore.incidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getIncidentById(id) {
    if (config.usePostgres) {
      const res = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryStore.incidents.find(i => i.id === parseInt(id)) || null;
  },

  async createIncident(data) {
    if (config.usePostgres) {
      const res = await pool.query(
        `INSERT INTO incidents (product_name, company_name, parent_corporation, category, text_content, skeptic_score, severity, flag_type, status, submitted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [data.product_name, data.company_name, data.parent_corporation || 'Independent', data.category, data.text_content || '', data.skeptic_score, data.severity, data.flag_type || '', data.status || 'Pending', data.submitted_by || null]
      );
      return res.rows[0];
    }
    const incident = {
      id: nextId('incidents'),
      ...data,
      parent_corporation: data.parent_corporation || 'Independent',
      status: data.status || 'Pending',
      flag_type: data.flag_type || '',
      created_at: new Date().toISOString()
    };
    memoryStore.incidents.push(incident);
    pruneIncidents();
    return incident;
  },

  async updateIncidentStatus(id, status) {
    if (config.usePostgres) {
      const res = await pool.query('UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return res.rows[0] || null;
    }
    const incident = memoryStore.incidents.find(i => i.id === parseInt(id));
    if (incident) incident.status = status;
    return incident || null;
  },

  async deleteIncident(id) {
    if (config.usePostgres) {
      const res = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
    }
    const idx = memoryStore.incidents.findIndex(i => i.id === parseInt(id));
    if (idx !== -1) return memoryStore.incidents.splice(idx, 1)[0];
    return null;
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────
  async logAction(userId, action, details) {
    if (config.usePostgres) {
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1,$2,$3)',
        [userId, action, details || '']
      );
      return;
    }
    memoryStore.audit_logs.push({
      id: nextId('audit_logs'),
      user_id: userId,
      action,
      details: details || '',
      created_at: new Date().toISOString()
    });
    pruneAuditLogs();
  },

  async getAuditLogs() {
    if (config.usePostgres) {
      const res = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
      return res.rows;
    }
    return [...memoryStore.audit_logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);
  },

  // ── Utility ─────────────────────────────────────────────────────────────
  getMemoryStore() {
    return memoryStore;
  }
};

export default db;
