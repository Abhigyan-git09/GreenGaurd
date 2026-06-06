# GreenGaurd

**Exposing Greenwashing with AI and Open Data**

GreenGaurd is a platform designed to help consumers, auditors, and activists cut through deceptive marketing. By combining deep-context AI analysis with global corporate databases, GreenGaurd scores products, dissects ESG reports, and unmasks the hidden corporate networks behind everyday brands.

---

## Key Features

**Vision AI Product Scanner**
Upload a photo of any product packaging. GreenGaurd uses Gemini Multimodal AI to instantly extract the text, analyze the claims against FTC Green Guides, and highlight the "Seven Sins of Greenwashing" right on the image.

**ESG Report Analyzer**
Paste snippets of corporate sustainability reports. The AI strips away the marketing language to tell you exactly what is factual and what is deceptive, scoring the text on a skeptic scale.

**Corporate Web Graph**
GreenGaurd integrates with OpenCorporates to map out complex parent-subsidiary relationships in an interactive force graph, showing you who really owns the brands you purchase.

**Live Alert Feed**
A real-time WebSocket dashboard that streams the latest greenwashing incidents, product bans, and regulatory actions globally.

**Role-Based Access**
Secure authentication system supporting consumers, sustainability auditors, and platform administrators.

---

## Tech Stack

GreenGaurd is built with a modern JavaScript architecture designed for performance and a premium user experience.

**Frontend**
- React 19 & Vite for rendering and state management
- Tailwind CSS for styling and UI design
- react-force-graph-2d for interactive corporate mapping
- Recharts for live telemetry and data visualization

**Backend**
- Node.js & Express providing a robust REST API
- WebSocket (ws) for the live incident simulator feed
- Dual-Mode Database: Seamlessly switches between a local In-Memory Store and PostgreSQL
- JWT & bcryptjs for secure authentication and password hashing

**Intelligence & APIs**
- Google Gemini Multimodal API: Powers the Vision AI OCR and deep-context greenwashing analysis
- Open Food Facts API: Retrieves real-world ingredient lists and existing eco-labels from a public database
- OpenCorporates API: Provides live corporate registry lookups to map parent companies to their subsidiaries

---

## Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/Abhigyan-git09/GreenGaurd.git
cd GreenGaurd
```

### 2. Setup the Backend
Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key
# DATABASE_URL=postgresql://user:pass@host/db (Optional)
```

Start the backend server:
```bash
npm start
```

### 3. Setup the Frontend
Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://127.0.0.1:5000
VITE_WS_URL=ws://127.0.0.1:5000/ws
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:5173` to access the platform locally.

---

## Contributing
We welcome contributions. If you find a bug or want to improve the platform, feel free to open a Pull Request.
