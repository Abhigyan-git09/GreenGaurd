import { Router } from 'express';
import { authenticateToken } from './auth.js';
import db from '../db/db.js';
import { searchCompany } from '../services/opencorporates.js';

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

router.get('/opencorporates/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const companies = await searchCompany(query);
    
    // Convert to nodes and links for the force graph
    // The OpenCorporates search results typically don't have direct parent/subsidiary links
    // in the basic search. We'll map the found companies as siblings under a mock "Corporate Grouping"
    // or just return them as individual nodes if they are independent.
    const nodes = [];
    const links = [];

    // Parent node representing the search query grouping
    const parentId = `Search: ${query.toUpperCase()}`;
    nodes.push({ id: parentId, label: parentId, group: 'parent', incidentCount: 0 });

    companies.slice(0, 15).forEach(c => {
      const uniqueId = `${c.jurisdiction_code}-${c.company_number}`;
      nodes.push({ id: uniqueId, label: c.name, group: 'subsidiary', incidentCount: 0, rawData: c });
      links.push({ source: parentId, target: uniqueId, value: 1 });
    });

    res.json({
      nodes,
      links,
      stats: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        totalIncidents: 0
      }
    });

  } catch (err) {
    console.error('[DATABASE] OpenCorporates search error:', err);
    res.status(500).json({ error: 'Failed to search OpenCorporates.' });
  }
});

export default router;
