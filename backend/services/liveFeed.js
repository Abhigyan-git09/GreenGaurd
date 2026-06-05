// services/liveFeed.js — WebSocket live event stream generator
// Simulates crowd-sourced greenwashing scans arriving every 15 seconds

import db from '../db/db.js';

const STREAM_COMPANIES = [
  { name: 'EcoGas Corp', parent: 'ChevronUnion', category: 'Energy', texts: 'Our gas is mixed with 5% biofuels to offset 100% of pipeline transit emissions. Natural warmth for your home.' },
  { name: 'VerdeThread Apparel', parent: 'GlobalRetail', category: 'Apparel', texts: 'This consciously manufactured winter collection uses synthetic fabrics sourced from eco-certified spinning mills.' },
  { name: 'BioPlast FoodWrap', parent: 'WrapGroup', category: 'Plastics', texts: 'Compostable plastic wrap that breaks down in backyard compost bins within 90 days. Keep food fresh sustainably.' },
  { name: 'GigaCell Batteries', parent: 'PowerHoldings', category: 'Electronics', texts: 'Eco-safe cobalt batteries harvested with full environmental audits in compliance with ethical minerals guidelines.' },
  { name: 'AquaLux Bottled Water', parent: 'NestleWaters', category: 'Beverages', texts: 'Pure mountain spring water in our new 100% recyclable plant-based bottles. Naturally alkaline and eco-friendly.' },
  { name: 'TerraMotors EV', parent: 'AutoGiant Group', category: 'Automotive', texts: 'Zero-emission electric vehicles powered by renewable energy credits and carbon-neutral manufacturing processes.' },
  { name: 'GreenVault Finance', parent: 'WallStreet Holdings', category: 'Finance', texts: 'Invest in our sustainable future fund with guaranteed net-zero impact. Green bonds for a cleaner tomorrow.' },
  { name: 'PureHarvest Farms', parent: 'AgriFoods Inc.', category: 'Food', texts: 'Organic, pesticide-free produce from our sustainable farms. 100% natural and ethically sourced.' }
];

const FLAG_TYPES = ['Blatant False Claim', 'Offset Manipulation', 'Unverified Certification', 'Vague Marketing Wording', 'False Biodegradable Claims'];
const SIN_TYPES = [
  'Sin of Fibbing',
  'Sin of Vagueness',
  'Sin of No Proof',
  'Sin of the Hidden Trade-off',
  'Sin of Worshipping False Labels',
  'Sin of Lesser of Two Evils'
];

let intervalId = null;

export function startLiveFeedSimulator(broadcastFn) {
  if (intervalId) return; // Already running

  console.log('[LIVE FEED] Simulator started — emitting events every 15s');

  intervalId = setInterval(async () => {
    const company = STREAM_COMPANIES[Math.floor(Math.random() * STREAM_COMPANIES.length)];
    const skepticScore = Math.floor(Math.random() * 60) + 40; // 40–100
    const severity = skepticScore > 75 ? 'Critical' : skepticScore > 40 ? 'Medium' : 'Low';
    const flagType = FLAG_TYPES[Math.floor(Math.random() * FLAG_TYPES.length)];
    const sinType = SIN_TYPES[Math.floor(Math.random() * SIN_TYPES.length)];

    try {
      const incident = await db.createIncident({
        product_name: `Scanned: ${company.name}`,
        company_name: company.name,
        parent_corporation: company.parent,
        category: company.category,
        text_content: company.texts,
        skeptic_score: skepticScore,
        severity,
        flag_type: flagType,
        status: 'Pending',
        submitted_by: 1
      });

      const alert = {
        id: incident.id,
        companyName: company.name,
        parentCorporation: company.parent,
        category: company.category,
        skepticScore,
        severity,
        status: 'Pending',
        flagType,
        sinType,
        text_content: company.texts,
        timestamp: 'Just scanned'
      };

      broadcastFn({ type: 'NEW_ALERT', alert });
    } catch (err) {
      console.error('[LIVE FEED] Error persisting simulated event:', err);
    }
  }, 15000);
}

export function stopLiveFeedSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[LIVE FEED] Simulator stopped.');
  }
}
