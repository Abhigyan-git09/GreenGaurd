// routes/incidents.js — CRUD + Verify/Reject for incident database
import { Router } from 'express';
import { authenticateToken, requireRole } from './auth.js';
import db from '../db/db.js';

const router = Router();

// ── GET /api/incidents — List all incidents ─────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await db.getAllIncidents();

    // Map snake_case DB columns to camelCase for the frontend
    const incidents = rows.map(row => ({
      id: row.id,
      productName: row.product_name,
      companyName: row.company_name,
      parentCorporation: row.parent_corporation,
      category: row.category,
      skepticScore: parseFloat(row.skeptic_score),
      severity: row.severity,
      status: row.status,
      flagType: row.flag_type,
      text_content: row.text_content,
      created_at: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    }));

    res.json(incidents);
  } catch (err) {
    console.error('[INCIDENTS] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch incidents.' });
  }
});

// ── POST /api/incidents/:id/verify — Auditor/Admin verifies a claim ─────────
router.post('/:id/verify', authenticateToken, requireRole('auditor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateIncidentStatus(id, 'Verified');

    if (!updated) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    await db.logAction(req.user.id, 'VERIFY', `Verified incident #${id}`);

    // Broadcast status change via WebSocket
    if (req.app.get('wsBroadcast')) {
      req.app.get('wsBroadcast')({
        type: 'STATUS_CHANGE',
        incidentId: parseInt(id),
        newStatus: 'Verified'
      });
    }

    res.json({
      id: updated.id,
      productName: updated.product_name,
      companyName: updated.company_name,
      parentCorporation: updated.parent_corporation,
      category: updated.category,
      skepticScore: parseFloat(updated.skeptic_score),
      severity: updated.severity,
      status: 'Verified',
      flagType: updated.flag_type,
      text_content: updated.text_content,
      created_at: updated.created_at ? new Date(updated.created_at).toISOString().split('T')[0] : ''
    });
  } catch (err) {
    console.error('[INCIDENTS] Verify error:', err);
    res.status(500).json({ error: 'Failed to verify incident.' });
  }
});

// ── POST /api/incidents/:id/reject — Auditor/Admin rejects a claim ──────────
router.post('/:id/reject', authenticateToken, requireRole('auditor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateIncidentStatus(id, 'Rejected');

    if (!updated) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    await db.logAction(req.user.id, 'REJECT', `Rejected incident #${id}`);

    if (req.app.get('wsBroadcast')) {
      req.app.get('wsBroadcast')({
        type: 'STATUS_CHANGE',
        incidentId: parseInt(id),
        newStatus: 'Rejected'
      });
    }

    res.json({
      id: updated.id,
      productName: updated.product_name,
      companyName: updated.company_name,
      parentCorporation: updated.parent_corporation,
      category: updated.category,
      skepticScore: parseFloat(updated.skeptic_score),
      severity: updated.severity,
      status: 'Rejected',
      flagType: updated.flag_type,
      text_content: updated.text_content,
      created_at: updated.created_at ? new Date(updated.created_at).toISOString().split('T')[0] : ''
    });
  } catch (err) {
    console.error('[INCIDENTS] Reject error:', err);
    res.status(500).json({ error: 'Failed to reject incident.' });
  }
});

// ── DELETE /api/incidents/:id — Admin-only delete ───────────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteIncident(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    await db.logAction(req.user.id, 'DELETE', `Deleted incident #${id}`);

    res.json({ message: 'Incident deleted.', id: parseInt(id) });
  } catch (err) {
    console.error('[INCIDENTS] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete incident.' });
  }
});

export default router;
