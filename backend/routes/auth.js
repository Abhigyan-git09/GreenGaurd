// routes/auth.js — JWT Authentication & RBAC middleware
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';
import db from '../db/db.js';

const router = Router();

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Wrong password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    await db.logAction(user.id, 'LOGIN', `User ${user.email} logged in.`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        title: user.title
      }
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full_name are required.' });
    }

    const existing = await db.findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email: email.toLowerCase(),
      password_hash: hash,
      role: role || 'consumer',
      full_name,
      title: role === 'admin' ? 'Platform Administrator' : role === 'auditor' ? 'Sustainability Auditor' : 'General Consumer'
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        title: user.title
      }
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/auth/me — Verify token and return user info ────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.findUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      title: user.title
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.findUserByEmail(email.toLowerCase());
    if (!user) {
      // For security, we still return a success message so we don't leak registered emails
      return res.json({ message: 'If an account with that email exists, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.savePasswordResetToken(user.email, resetToken, expires.toISOString());

    // SIMULATED EMAIL SENDING
    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL] To: ${user.email}`);
    console.log(`[SIMULATED EMAIL] Subject: Password Reset Request`);
    console.log(`[SIMULATED EMAIL] Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`======================================================\n`);

    res.json({ message: 'If an account with that email exists, a password reset link has been generated.' });
  } catch (err) {
    console.error('[AUTH] Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const user = await db.findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.updatePasswordAndClearToken(user.id, hash);
    await db.logAction(user.id, 'PASSWORD_RESET', 'User reset their password via token.');

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    console.error('[AUTH] Reset password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Middleware: Authenticate JWT ─────────────────────────────────────────────
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// ── Middleware: Role-based access check ──────────────────────────────────────
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
    }
    next();
  };
}

export default router;
