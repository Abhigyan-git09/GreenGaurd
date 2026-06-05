# Phase 7: Advanced Features Handoff Document

This document outlines the architectural plan and implementation steps for adding the three advanced "Deep-Dive" features to the EcoSkeptic platform. **Crucially, these changes are designed to be additive and non-destructive**, ensuring the existing ML scanner, Live Feed, and Accountability Database remain fully functional.

---

## 1. The "7 Sins of Greenwashing" Taxonomy Classifier

**Goal:** Elevate the heuristic engine from a simple "deceptive/critical" binary to a nuanced classification system based on the universally recognized 7 Sins of Greenwashing.

### Backend Implementation (`backend/routes/analysis.js`)
*   **Update the Lexicon:** Modify the existing `LEXICON` array. Each entry will receive a new `sinType` attribute (e.g., "Sin of Vagueness", "Sin of No Proof", "Sin of the Hidden Trade-off").
*   **Update the Scoring Engine:** When `text.match(entry.pattern)` fires, include the `sinType` in the `matches` array pushed to the results.
*   **Update Incident DB Storage (Optional but Recommended):** Modify the `db.createIncident` call to include the primary `sin_type` in the `flag_type` column so it persists in the Corporate Database.

### Frontend Implementation
*   **ScannerWorkspace.jsx:** Update the `nlpHighlights` rendering logic. Currently, it just shows `m.type` (critical/deceptive). Add a small UI badge inside the highlight tooltip that explicitly names the Sin (e.g., `<span className="badge">Sin of Vagueness</span>`).
*   **LiveAlertFeed.jsx:** Update the slide-in alert cards to display the `sinType` right below the Incident Title, giving Auditors immediate context on the deceptive tactic used.

---

## 2. Corporate Network Graph (The "Illusion of Choice")

**Goal:** Create a visual force-directed graph showing how "independent" eco-brands are actually subsidiaries of mega-corporations.

### Backend Implementation (`backend/routes/database.js`)
*   **New Endpoint (`GET /api/database/network`):** 
    *   Query the `products` table for all incidents.
    *   Transform the tabular data into a structured Node-Link JSON format:
        *   `nodes`: `[{ id: 'Unilever', group: 'parent' }, { id: 'GreenClean Co.', group: 'subsidiary' }, ...]`
        *   `links`: `[{ source: 'Unilever', target: 'GreenClean Co.', value: 1 }]`
    *   Serve this JSON to the frontend.

### Frontend Implementation
*   **Dependencies:** Install `react-force-graph-2d` (or `recharts` network if preferred).
*   **New Component (`CorporateWeb.jsx`):** A full-page visualizer component that fetches data from `/api/database/network` and renders the physics-based graph.
*   **Integration (`App.jsx`):** Add a new Tab in the sidebar navigation (`Corporate Web`) alongside the Scanner Center and Offender DB. When clicked, it renders the `CorporateWeb` component.

---

## 3. ESG "Sustainability Report" Batch Analyzer

**Goal:** Allow users to scan large blocks of text (ESG reports) and generate a "Fluff vs. Fact" Report Card.

### Backend Implementation (`backend/routes/analysis.js`)
*   **New Endpoint (`POST /api/scan/esg`):**
    *   Accepts large text payloads (`text`).
    *   **Logic:** Count the total number of words. 
    *   Count "Vague Fluff" words (e.g., "journey", "commitment", "strive", "sustainability", "eco").
    *   Count "Concrete Metrics" (e.g., numbers `\d+`, percentages `%`, years `202[0-9]`, "tons", "liters").
    *   **Response:** Return an `esgReportCard` object containing the `fluffRatio`, a grade (A-F), and arrays of extracted concrete metrics vs extracted fluff sentences.

### Frontend Implementation (`ScannerWorkspace.jsx`)
*   **Mode Toggle:** Add a UI toggle at the top of the workspace: "Product Scanner" vs "ESG Report Analyzer".
*   **UI State Shift:** 
    *   If "ESG Report Analyzer" is active, hide the Vision AI mockup image.
    *   Expand the text area to full width/height.
    *   Change the scan button to call the new `/api/scan/esg` endpoint.
*   **Results View:** Render a clean "Report Card" UI instead of the bounding boxes, displaying the Fluff Ratio pie chart and listing the concrete metrics found (or warning that none were found).

---

## Execution Safety Protocol

To ensure we do not break existing functionality:
1. All new backend endpoints will be *additive* (using new route paths).
2. Any changes to the existing `/api/scan` endpoint will be strictly backwards-compatible (adding fields, not removing or renaming them).
3. The frontend `App.jsx` state machine will be carefully updated to accommodate the new `network` tab without disrupting the existing `scanner` and `database` tabs.
