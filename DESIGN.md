# Design System: EcoSkeptic Greenwashing Detector

## 1. Visual Theme & Atmosphere
A clinical, high-density dark-mode interface with a deep forest green base and vibrant emerald green accents. The aesthetic uses glassmorphic panels, subtle glow borders, and clean alignment to present complex investigative data clearly. The density is balanced for audit-cockpit environments (Density: 7, Variance: 6, Motion: 6).

## 2. Color Palette & Roles
*   **Deep Abyssal Canvas** (#050B08) — Primary canvas background
*   **Forest Surface** (#0D1713) — Cards, sidebar, and container background
*   **Vibrant Emerald** (#10B981) — Brand primary for CTAs, active indicators, and verification highlights
*   **Muted Mint** (#98F5D2) — Secondary text and low-severity indicator highlights
*   **Warning Orange** (#F97316) — Medium-severity alerts and moderate skeptic warnings
*   **Alert Crimson** (#EF4444) — Critical severity greenwashing flags and high-skeptic-score highlights
*   **Text Ivory** (#ECFDF5) — High contrast text color
*   **Text Slate** (#6B7F76) — Secondary text and descriptions
*   **Whisper Border** (rgba(16, 185, 129, 0.12)) — Subtly glowing 1px border separator

## 3. Typography Rules
*   **Display / Headers:** Outfit — Track-tight (-0.02em), bold/medium weights. Modern and striking.
*   **Body:** Satoshi — Relaxed line height (1.6), maximum 65 characters per line.
*   **Monospace / Numeric:** JetBrains Mono — For skeptic scores, telemetry metrics, and time stamps.
*   **Banned:** Inter, standard system sans-serifs, and generic serif fonts (Times New Roman, Georgia).

## 4. Component Stylings
*   **Buttons:** Flat with slight inset shadows, rounded-lg (8px). On active press, apply a -1px Y-translate. Primary buttons use Emerald fill with Ivory text. Secondary buttons use transparent fill with an emerald border.
*   **Cards:** Rounded corners (16px). Outlined by Whisper Border. Elevated cards use a diffused green-tinted shadow. No neon outer glow overlays.
*   **Inputs:** Forest Surface background, Whisper Border. Focused state transitions border to Vibrant Emerald with a subtle focus outline. Labels must sit above the inputs.
*   **Indicators & Badges:** Oval pills with subtle backgrounds. Low (Mint), Medium (Orange), Critical (Crimson). Critical badges include a CSS-pulsing indicator.
*   **Interactive Dials:** Skeptic score dials use circular visual meters that transition from Mint to Orange to Crimson as the score increases.

## 5. Layout Principles
*   **Grid Structure:** Dynamic dashboard layout with a sticky left sidebar and a wide scrollable content pane.
*   **Asymmetric Split:** Splitting the dashboard panels to have the main interactive workspace (left, 60% width) and the live flagging feed (right, 40% width).
*   **Mobile-First Collapse:** Multi-column panels collapse into a single-column layout below 768px. Touch targets are scaled to a minimum of 44px.

## 6. Motion & Interaction
*   **Spring Physics:** Weighty animations (`stiffness: 100, damping: 20`) for dialog openings and card expansions.
*   **Perpetual Micro-Interactions:** Subtle vertical floating on stats indicators and shimmering effects on loading panels.
*   **Staggered Reveal:** Cascade delays for loading lists of greenwashing alerts.

## 7. Anti-Patterns (Banned)
*   No emojis anywhere in the interface.
*   No pure black (#000000) or pure white (#FFFFFF).
*   No blue or purple gradients.
*   No overlapping absolute elements.
*   No 3-column equal card grids.
*   No fabricated metrics (always display clear placeholder labels for empty states).
