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

// Services
import { startLiveFeedSimulator } from './services/liveFeed.js';

const app = express();
const server = createServer(app);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    // Add your production frontend URL here when deploying:
    // 'https://ecoskeptic.vercel.app',
  ],
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
