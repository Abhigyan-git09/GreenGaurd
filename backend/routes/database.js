import { Router } from 'express';
import { authenticateToken } from './auth.js';
import db from '../db/db.js';

const router = Router();

router.get('/network', authenticateToken, async (req, res) => {
  try {
    const incidents = await db.getAllIncidents();

    const nodeMap = new Map();
    const linkMap = new Map();
    const childCounts = new Map();

    for (const inc of incidents) {
      const parent = (inc.parent_corporation || 'Independent').trim();
      const company = (inc.company_name || '').trim();
      if (!company) continue;

      if (!nodeMap.has(parent)) {
        nodeMap.set(parent, { id: parent, group: 'parent', incidentCount: 0 });
      }
      nodeMap.get(parent).incidentCount += 1;

      if (!nodeMap.has(company)) {
        nodeMap.set(company, { id: company, group: 'subsidiary', incidentCount: 0 });
      }
      nodeMap.get(company).incidentCount += 1;

      if (parent && parent.toLowerCase() !== 'independent' && parent !== company) {
        const key = `${parent}::${company}`;
        const existing = linkMap.get(key);
        if (existing) {
          existing.value += 1;
        } else {
          linkMap.set(key, { source: parent, target: company, value: 1 });
        }
        childCounts.set(parent, (childCounts.get(parent) || 0) + 1);
      }
    }

    for (const [id, node] of nodeMap.entries()) {
      if (node.group === 'parent' && (childCounts.get(id) || 0) > 0) {
        node.childCount = childCounts.get(id);
      }
    }

    res.json({
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
      stats: {
        totalNodes: nodeMap.size,
        totalLinks: linkMap.size,
        totalIncidents: incidents.length
      }
    });
  } catch (err) {
    console.error('[DATABASE] Network fetch error:', err);
    res.status(500).json({ error: 'Failed to build corporate network.' });
  }
});

export default router;
