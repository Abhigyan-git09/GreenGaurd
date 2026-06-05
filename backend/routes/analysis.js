// routes/analysis.js — Simulated ML greenwashing scanner
import { Router } from 'express';
import { authenticateToken } from './auth.js';
import db from '../db/db.js';

const router = Router();

async function callGemini(systemPrompt, userText) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return null;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nText to analyze:\n" + userText }] }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
    if (!response.ok) {
      console.error("[GEMINI] HTTP Error:", response.status, await response.text());
      return null;
    }
    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return JSON.parse(data.candidates[0].content.parts[0].text);
    }
  } catch (err) {
    console.error("[GEMINI] API Error:", err);
  }
  return null;
}


const SINS = {
  VAGUENESS: 'Sin of Vagueness',
  NO_PROOF: 'Sin of No Proof',
  HIDDEN_TRADEOFF: 'Sin of the Hidden Trade-off',
  FIBBING: 'Sin of Fibbing',
  FALSE_LABELS: 'Sin of Worshipping False Labels',
  IRRELEVANCE: 'Sin of Irrelevance',
  LESSER_EVIL: 'Sin of Lesser of Two Evils'
};

const LEXICON = [
  { pattern: /carbon[- ]?neutral/gi, label: 'Carbon-Neutral Claim', severity: 'critical', sinType: SINS.FIBBING, explanation: 'Carbon neutrality claims often rely on unverified offset schemes that do not achieve actual emission reductions.' },
  { pattern: /net[- ]?zero/gi, label: 'Net-Zero Target', severity: 'critical', sinType: SINS.FIBBING, explanation: 'Net-zero pledges without concrete interim milestones are considered greenwashing by the UN High-Level Expert Group.' },
  { pattern: /100%\s*(natural|organic|sustainable|renewable)/gi, label: 'Absolute Purity Claim', severity: 'critical', sinType: SINS.FIBBING, explanation: 'Absolute claims (100%) are almost never verifiable across complex supply chains.' },
  { pattern: /offset(s|ting|ted)?/gi, label: 'Offset Reliance', severity: 'critical', sinType: SINS.HIDDEN_TRADEOFF, explanation: 'Carbon offsets have been shown to be largely ineffective. Over 90% of rainforest offsets are worthless according to recent studies.' },
  { pattern: /eco[- ]?(friendly|safe|certified|conscious)/gi, label: 'Eco-Label Abuse', severity: 'deceptive', sinType: SINS.NO_PROOF, explanation: 'Self-declared eco-labels without third-party certification are a common greenwashing tactic.' },
  { pattern: /biodegradable/gi, label: 'Biodegradable Claim', severity: 'deceptive', sinType: SINS.HIDDEN_TRADEOFF, explanation: 'Most "biodegradable" products only degrade under specific industrial composting conditions, not in landfills or oceans.' },
  { pattern: /sustainab(le|ility)/gi, label: 'Vague Sustainability', severity: 'deceptive', sinType: SINS.VAGUENESS, explanation: 'Sustainability is used without measurable benchmarks or timelines, making the claim unverifiable.' },
  { pattern: /green|clean/gi, label: 'Green/Clean Washing', severity: 'deceptive', sinType: SINS.VAGUENESS, explanation: 'Generic "green" or "clean" language evokes environmental responsibility without any specific commitments.' },
  { pattern: /natural/gi, label: 'Natural Appeal', severity: 'low', sinType: SINS.VAGUENESS, explanation: '"Natural" has no regulated definition in most industries and is frequently used to imply safety without evidence.' },
  { pattern: /organic/gi, label: 'Organic Claim', severity: 'low', sinType: SINS.FALSE_LABELS, explanation: 'Without certified organic labels (USDA, EU Organic), the term is unregulated and potentially misleading.' },
  { pattern: /guilt[- ]?free/gi, label: 'Emotional Manipulation', severity: 'critical', sinType: SINS.VAGUENESS, explanation: 'Psychologically manipulative language designed to suppress legitimate consumer concern about environmental impact.' },
  { pattern: /plant[- ]?based/gi, label: 'Plant-Based Positioning', severity: 'low', sinType: SINS.LESSER_EVIL, explanation: 'Plant-based claims can obscure high environmental costs in agricultural water usage and deforestation.' },
  { pattern: /compostable/gi, label: 'Compostable Claim', severity: 'deceptive', sinType: SINS.HIDDEN_TRADEOFF, explanation: 'Most compostable packaging requires industrial composting facilities and will not break down in home compost.' },
  { pattern: /zero[- ]?(emission|carbon|waste)/gi, label: 'Zero-Impact Claim', severity: 'critical', sinType: SINS.FIBBING, explanation: 'Zero-emission claims are nearly always false when full lifecycle emissions are considered.' },
  { pattern: /renewable/gi, label: 'Renewable Source Claim', severity: 'low', sinType: SINS.VAGUENESS, explanation: 'Renewable claims should specify the percentage of renewable vs conventional sources used.' }
];

// ── POST /api/scan — Analyze text for greenwashing ──────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, strictness = 50, company_name, category } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required for analysis.' });
    }

    let matches = [];
    let totalWeight = 0;

    // 1. Try Real Intelligence via Gemini
    if (process.env.GEMINI_API_KEY) {
      const systemPrompt = `You are a corporate greenwashing detector. Analyze the text against FTC Green Guides.
Identify specific greenwashing claims.
Return ONLY a JSON array of objects. Each object must have:
"text": the exact excerpt from the input,
"label": short title of the deceptive tactic (e.g., "Vague Marketing"),
"type": either "critical", "deceptive", or "low",
"sinType": one of ["Sin of Vagueness", "Sin of No Proof", "Sin of the Hidden Trade-off", "Sin of Fibbing", "Sin of Worshipping False Labels", "Sin of Irrelevance", "Sin of Lesser of Two Evils"],
"explanation": a 1-sentence explanation of why it is greenwashing.
"occurrences": 1`;

      const geminiResult = await callGemini(systemPrompt, text);
      if (geminiResult && Array.isArray(geminiResult)) {
        matches = geminiResult;
        for (const m of matches) {
          totalWeight += (m.type === 'critical' ? 25 : m.type === 'deceptive' ? 15 : 8);
        }
      }
    }

    // 2. Fallback to Regex Lexicon if Gemini fails or is missing
    if (matches.length === 0) {
      for (const entry of LEXICON) {
        const found = text.match(entry.pattern);
        if (found) {
          const weight = entry.severity === 'critical' ? 25 : entry.severity === 'deceptive' ? 15 : 8;
          totalWeight += weight * found.length;

          matches.push({
            text: found[0],
            label: entry.label,
            type: entry.severity,
            sinType: entry.sinType,
            explanation: entry.explanation,
            occurrences: found.length
          });
        }
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
    const sinType = topMatch ? topMatch.sinType : SINS.VAGUENESS;

    // Build response
    const result = {
      skepticScore: adjustedScore,
      severity,
      flagType,
      sinType,
      matchCount: matches.length,
      matches,
      // NLP highlights for the frontend to render
      nlpHighlights: matches.slice(0, 5).map(m => ({
        text: m.text,
        type: m.type === 'critical' ? 'critical' : 'deceptive',
        sinType: m.sinType,
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
          sinType,
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

const ESG_FLUFF_WORDS = [
  'journey', 'commitment', 'strive', 'striving', 'sustainability', 'sustainable',
  'eco', 'eco-friendly', 'green', 'clean', 'natural', 'responsible', 'responsibly',
  'vision', 'mission', 'pledge', 'promise', 'believe', 'aspire', 'aspiration',
  'stewardship', 'holistic', 'synergy', 'transformative', 'purpose-driven', 'mindful',
  'conscientious', 'conscious', 'thoughtful', 'passionate', 'dedicated', 'planet',
  'future', 'tomorrow', 'generation', 'legacy', 'harmony', 'ecosystem'
];

const ESG_METRIC_PATTERNS = [
  { regex: /\b\d{1,3}(?:[.,]\d+)?\s*%/g, kind: 'percentage' },
  { regex: /\b20[0-9]{2}\b/g, kind: 'year' },
  { regex: /\b\d+(?:[.,]\d+)?\s*(?:tons?|tonnes?|kg|kilograms?|lbs?|pounds?|liters?|litres?|gallons?|m3|cubic\s*meters?|mw|gw|kwh|mwh)\b/gi, kind: 'unit' },
  { regex: /\$\s*\d+(?:[.,]\d+)?\s*(?:million|billion|m|bn|k)?/gi, kind: 'currency' },
  { regex: /\b(?:scope\s*[123]|ghg|co2e?|co₂e?|tco2e?|emissions?)\b/gi, kind: 'emissions' },
  { regex: /\b(?:net[\s-]?zero|carbon[\s-]?neutral|carbon[\s-]?negative|absolute\s*zero)\b/gi, kind: 'pledge' }
];

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])|(?:\n)+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function findMetrics(text) {
  const metrics = [];
  for (const { regex, kind } of ESG_METRIC_PATTERNS) {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach((m) => metrics.push({ value: m, kind }));
    }
  }
  return metrics;
}

function findFluffSentences(sentences) {
  const fluffSentences = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let hits = 0;
    const hitsList = [];
    for (const word of ESG_FLUFF_WORDS) {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const found = lower.match(re);
      if (found) {
        hits += found.length;
        hitsList.push(word);
      }
    }
    if (hits > 0) {
      fluffSentences.push({ sentence, hits, words: [...new Set(hitsList)] });
    }
  }
  return fluffSentences;
}

function findConcreteSentences(sentences, metrics) {
  if (metrics.length === 0) return [];
  return sentences
    .filter((s) => ESG_METRIC_PATTERNS.some(({ regex }) => regex.test(s)))
    .slice(0, 25);
}

function gradeFor(fluffRatio, concreteCount) {
  if (concreteCount === 0 && fluffRatio > 0.5) return 'F';
  if (fluffRatio >= 0.75) return 'F';
  if (fluffRatio >= 0.5) return 'D';
  if (fluffRatio >= 0.3) return 'C';
  if (fluffRatio >= 0.15) return 'B';
  return 'A';
}

router.post('/esg', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'ESG text is required for analysis.' });
    }

    let esgReportCard = null;

    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an expert ESG auditor evaluating a corporate sustainability report. 
Calculate the ratio of vague buzzwords (fluff) to hard data (concrete metrics).
Return ONLY a JSON object with:
"totalWords": integer,
"fluffWordCount": integer (count of vague words like journey, striving, eco-friendly),
"concreteMetricCount": integer (count of hard data like 2030, 50%, tons),
"concreteMetrics": array of objects { "value": "50%", "kind": "percentage" },
"fluffSentences": array of objects { "sentence": "We are on a journey to a sustainable future.", "hits": 2, "words": ["journey", "sustainable"] },
"concreteSentences": array of strings (sentences containing the metrics)`;

      const geminiResult = await callGemini(prompt, text);
      if (geminiResult && geminiResult.totalWords !== undefined) {
        const fluffRatio = geminiResult.totalWords > 0 ? +(geminiResult.fluffWordCount / geminiResult.totalWords).toFixed(3) : 0;
        const grade = gradeFor(fluffRatio, geminiResult.concreteMetricCount);
        esgReportCard = {
          ...geminiResult,
          totalSentences: geminiResult.fluffSentences.length + geminiResult.concreteSentences.length,
          fluffRatio,
          grade,
          generatedAt: new Date().toISOString()
        };
      }
    }

    if (!esgReportCard) {
      // Fallback to regex analysis
      const wordTokens = text.trim().split(/\s+/);
      const totalWords = wordTokens.length;
      const sentences = splitSentences(text);

      const fluffSentences = findFluffSentences(sentences);
      const fluffWordCount = fluffSentences.reduce((acc, s) => acc + s.hits, 0);
      const concreteMetrics = findMetrics(text);
      const concreteSentences = findConcreteSentences(sentences, concreteMetrics);

      const fluffRatio = totalWords > 0 ? +(fluffWordCount / totalWords).toFixed(3) : 0;
      const grade = gradeFor(fluffRatio, concreteMetrics.length);

      esgReportCard = {
        totalWords,
        totalSentences: sentences.length,
        fluffWordCount,
        concreteMetricCount: concreteMetrics.length,
        fluffRatio,
        grade,
        concreteMetrics: concreteMetrics.slice(0, 60),
        concreteSentences,
        fluffSentences: fluffSentences.slice(0, 20),
        generatedAt: new Date().toISOString()
      };
    }

    await db.logAction(req.user.id, 'ESG_SCAN', `ESG batch report scored. Words: ${esgReportCard.totalWords}, Fluff ratio: ${esgReportCard.fluffRatio}, Grade: ${esgReportCard.grade}`);

    res.json({ esgReportCard });
  } catch (err) {
    console.error('[ESG SCAN] Error:', err);
    res.status(500).json({ error: 'ESG analysis failed.' });
  }
});

// ── GET /api/scan/search/:query — Fetch real product data from Open Food Facts ──────────────────────────
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`, {
      headers: {
        'User-Agent': 'GreenGaurd_App/1.0 (admin@greengaurd.org)'
      }
    });
    if (!response.ok) throw new Error(`Open Food Facts API failed with status ${response.status}`);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      res.json({
        name: product.product_name || query,
        brand: product.brands || 'Unknown',
        ingredients: product.ingredients_text || 'No ingredients listed',
        ecoLabels: product.labels || 'No eco-labels found',
        image: product.image_url || null
      });
    } else {
      res.status(404).json({ error: 'Product not found in Open Food Facts database.' });
    }
  } catch (err) {
    console.error('[OPEN FOOD FACTS] Error:', err);
    res.status(500).json({ error: 'Failed to fetch product data.' });
  }
});

export default router;
