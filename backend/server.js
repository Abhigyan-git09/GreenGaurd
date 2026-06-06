// server.js — EcoSkeptic Express + WebSocket Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import config from './config.js';
import db from './db/db.js';
import { seed } from './db/seed.js';

// Routes
import authRouter from './routes/auth.js';
import analysisRouter from './routes/analysis.js';
import incidentsRouter from './routes/incidents.js';
import databaseRouter from './routes/database.js';

// Services
import { startLiveFeedSimulator } from './services/liveFeed.js';

const app = express();
const server = createServer(app);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// ── WebSocket Server ────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected. Total: ${wsClients.size}`);

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${wsClients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
    wsClients.delete(ws);
  });
});

// Broadcast function — sends JSON to all connected clients
function wsBroadcast(data) {
  const message = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  }
}

// Make broadcast available to route handlers
app.set('wsBroadcast', wsBroadcast);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/scan', analysisRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/database', databaseRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: config.usePostgres ? 'PostgreSQL' : 'In-Memory',
    uptime: Math.round(process.uptime()),
    wsClients: wsClients.size
  });
});

// ── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Create tables if using PostgreSQL
    if (config.usePostgres) {
      await db.createTables();
      console.log('[SERVER] PostgreSQL connected and tables verified.');
    } else {
      console.log('[SERVER] Running in In-Memory mode (no DATABASE_URL).');
    }

    // Auto-seed on first startup
    await seed();

    // Start the simulated live feed
    startLiveFeedSimulator(wsBroadcast);

    server.listen(config.port, () => {
      console.log(`\n══════════════════════════════════════════════`);
      console.log(`  EcoSkeptic Backend — ${config.nodeEnv.toUpperCase()}`);
      console.log(`  HTTP:  http://localhost:${config.port}`);
      console.log(`  WS:    ws://localhost:${config.port}/ws`);
      console.log(`  DB:    ${config.usePostgres ? 'PostgreSQL (Cloud)' : 'In-Memory (Dev)'}`);
      console.log(`══════════════════════════════════════════════\n`);
    });
  } catch (err) {
    console.error('[SERVER] Fatal startup error:', err);
    process.exit(1);
  }
}

start();

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled promise rejection:', reason);
});

function shutdown(signal) {
  console.log(`\n[SERVER] ${signal} received, shutting down gracefully…`);
  wss.clients.forEach((client) => {
    try { client.close(1001, 'server shutting down'); } catch (_) {}
  });
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('[SERVER] Forced shutdown after 5s timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
