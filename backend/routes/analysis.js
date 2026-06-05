// routes/analysis.js — Simulated ML greenwashing scanner
import { Router } from 'express';
import { authenticateToken } from './auth.js';
import db from '../db/db.js';

const router = Router();

// ── Greenwashing Lexicon ────────────────────────────────────────────────────
const LEXICON = [
  { pattern: /carbon[- ]?neutral/gi, label: 'Carbon-Neutral Claim', severity: 'critical', explanation: 'Carbon neutrality claims often rely on unverified offset schemes that do not achieve actual emission reductions.' },
  { pattern: /net[- ]?zero/gi, label: 'Net-Zero Target', severity: 'critical', explanation: 'Net-zero pledges without concrete interim milestones are considered greenwashing by the UN High-Level Expert Group.' },
  { pattern: /100%\s*(natural|organic|sustainable|renewable)/gi, label: 'Absolute Purity Claim', severity: 'critical', explanation: 'Absolute claims (100%) are almost never verifiable across complex supply chains.' },
  { pattern: /offset(s|ting|ted)?/gi, label: 'Offset Reliance', severity: 'critical', explanation: 'Carbon offsets have been shown to be largely ineffective. Over 90% of rainforest offsets are worthless according to recent studies.' },
  { pattern: /eco[- ]?(friendly|safe|certified|conscious)/gi, label: 'Eco-Label Abuse', severity: 'deceptive', explanation: 'Self-declared eco-labels without third-party certification are a common greenwashing tactic.' },
  { pattern: /biodegradable/gi, label: 'Biodegradable Claim', severity: 'deceptive', explanation: 'Most "biodegradable" products only degrade under specific industrial composting conditions, not in landfills or oceans.' },
  { pattern: /sustainab(le|ility)/gi, label: 'Vague Sustainability', severity: 'deceptive', explanation: 'Sustainability is used without measurable benchmarks or timelines, making the claim unverifiable.' },
  { pattern: /green|clean/gi, label: 'Green/Clean Washing', severity: 'deceptive', explanation: 'Generic "green" or "clean" language evokes environmental responsibility without any specific commitments.' },
  { pattern: /natural/gi, label: 'Natural Appeal', severity: 'low', explanation: '"Natural" has no regulated definition in most industries and is frequently used to imply safety without evidence.' },
  { pattern: /organic/gi, label: 'Organic Claim', severity: 'low', explanation: 'Without certified organic labels (USDA, EU Organic), the term is unregulated and potentially misleading.' },
  { pattern: /guilt[- ]?free/gi, label: 'Emotional Manipulation', severity: 'critical', explanation: 'Psychologically manipulative language designed to suppress legitimate consumer concern about environmental impact.' },
  { pattern: /plant[- ]?based/gi, label: 'Plant-Based Positioning', severity: 'low', explanation: 'Plant-based claims can obscure high environmental costs in agricultural water usage and deforestation.' },
  { pattern: /compostable/gi, label: 'Compostable Claim', severity: 'deceptive', explanation: 'Most compostable packaging requires industrial composting facilities and will not break down in home compost.' },
  { pattern: /zero[- ]?(emission|carbon|waste)/gi, label: 'Zero-Impact Claim', severity: 'critical', explanation: 'Zero-emission claims are nearly always false when full lifecycle emissions are considered.' },
  { pattern: /renewable/gi, label: 'Renewable Source Claim', severity: 'low', explanation: 'Renewable claims should specify the percentage of renewable vs conventional sources used.' }
];

// ── POST /api/scan — Analyze text for greenwashing ──────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, strictness = 50, company_name, category } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for analysis.' });
    }

    // Run lexicon analysis
    const matches = [];
    let totalWeight = 0;

    for (const entry of LEXICON) {
      const found = text.match(entry.pattern);
      if (found) {
        const weight = entry.severity === 'critical' ? 25 : entry.severity === 'deceptive' ? 15 : 8;
        totalWeight += weight * found.length;

        matches.push({
          text: found[0],
          label: entry.label,
          type: entry.severity,
          explanation: entry.explanation,
          occurrences: found.length
        });
      }
    }

    // Calculate skeptic score (0-100) adjusted by strictness
    const rawScore = Math.min(totalWeight, 100);
    const adjustedScore = Math.min(Math.round(rawScore * (strictness / 50)), 100);
    const severity = adjustedScore > 75 ? 'Critical' : adjustedScore > 40 ? 'Medium' : 'Low';

    // Determine flag type
    const topMatch = matches.sort((a, b) => {
      const w = { critical: 3, deceptive: 2, low: 1 };
      return (w[b.type] || 0) - (w[a.type] || 0);
    })[0];
    const flagType = topMatch ? topMatch.label : 'Vague Marketing Wording';

    // Build response
    const result = {
      skepticScore: adjustedScore,
      severity,
      flagType,
      matchCount: matches.length,
      matches,
      // NLP highlights for the frontend to render
      nlpHighlights: matches.slice(0, 5).map(m => ({
        text: m.text,
        type: m.type === 'critical' ? 'critical' : 'deceptive',
        desc: m.explanation
      })),
      // Mock vision bounding boxes
      visionBoxes: adjustedScore > 60 ? [
        { label: `SUSPICIOUS LABEL (${(85 + Math.random() * 10).toFixed(1)}%)`, style: { top: '22%', left: '20%', width: '30%', height: '15%' }, color: 'border-alert-crimson bg-alert-crimson/10 text-alert-crimson' },
        { label: `DECEPTIVE CUE (${(78 + Math.random() * 15).toFixed(1)}%)`, style: { bottom: '30%', right: '15%', width: '35%', height: '18%' }, color: 'border-warning-orange bg-warning-orange/10 text-warning-orange' }
      ] : []
    };

    // Persist as a new incident in the database
    const incident = await db.createIncident({
      product_name: `Scanned: ${(company_name || 'Unknown').substring(0, 50)}`,
      company_name: company_name || 'User Submission',
      parent_corporation: 'Independent',
      category: category || 'General',
      text_content: text.substring(0, 2000),
      skeptic_score: adjustedScore,
      severity,
      flag_type: flagType,
      status: 'Pending',
      submitted_by: req.user.id
    });

    await db.logAction(req.user.id, 'SCAN', `Scanned text with score ${adjustedScore}. Flag: ${flagType}`);

    // Broadcast to WebSocket clients (the server attaches wsBroadcast)
    if (req.app.get('wsBroadcast')) {
      req.app.get('wsBroadcast')({
        type: 'NEW_ALERT',
        alert: {
          id: incident.id,
          companyName: incident.company_name,
          parentCorporation: incident.parent_corporation,
          category: incident.category,
          skepticScore: adjustedScore,
          severity,
          status: 'Pending',
          flagType,
          text_content: text.substring(0, 500),
          timestamp: 'Just scanned'
        }
      });
    }

    res.json({ ...result, incidentId: incident.id });
  } catch (err) {
    console.error('[SCAN] Error:', err);
    res.status(500).json({ error: 'Analysis failed.' });
  }
});

export default router;
