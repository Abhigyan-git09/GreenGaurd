import React, { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Eye, Cpu, Sliders, ChevronDown, RefreshCw, AlertTriangle, FileText, Package, BarChart3, TrendingUp, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '../utils/api';

const MOCK_EXAMPLES = {
  shampoo: {
    name: 'Organic Shampoo Bottle',
    type: 'vision',
    strictness: 78,
    text: 'Formulated with 100% natural organic botanicals, our BioShampoo offsets carbon-neutral emissions. Made in an eco-certified carbon-friendly packaging facility. Green leaves guarantee purity.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeXdPa8ujI80yHgXa4yKt2PudiJygoyKFOBD5gN8IgBzxch03OFWZ1VtekujuFDUHDbzxXSbfKLNJmJi5JqYCquRd2mA7hXRC3WqOqtRxKkKX2Q9HzufOgPggJI576-2vGQpS1uOn7_kulHa6O9EXFhOs8K9fHGDvSgrRxLT8Yqu99HMthE52_JHAq0w6hTOR4_Sj_dMUy6ZHppgtOkSgLdrrskF2sFS1W-9WFvtcFtGHNhX-7f5DH4Z6bxE-I7x1Rp_lLVhnh894',
  },
  fashion: {
    name: 'Fast Fashion Eco-Tag',
    type: 'text',
    strictness: 55,
    text: 'This garments tag guarantees it belongs to our consciously crafted collection. We use 100% biodegradable materials to protect mother earth, reducing water utilization by 50%.',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
  },
  flight: {
    name: 'Net-Zero Flight Banner',
    type: 'text',
    strictness: 90,
    text: 'Fly guilt-free with our airline. Book now and instantly purchase a 100% green-friendly aviation fuel offset, contributing to our zero-carbon 2030 flight path goals.',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600',
  }
};

const ESG_SAMPLE = `At Verdant Industries, sustainability is at the heart of our journey. We are committed to building a greener tomorrow through responsible stewardship of our planet. Our mission is to drive transformative change as we strive to reduce our environmental footprint.

In 2023, we made meaningful progress on our sustainability journey. We diverted 1.2 million tons of waste from landfills and reduced our absolute Scope 1 and Scope 2 GHG emissions by 18% versus our 2019 baseline. Our team invested $42 million in efficiency programs across 14 facilities.

We believe in a holistic, purpose-driven approach. Our aspiration is to reach net-zero across our value chain by 2040. We pledge to be a mindful steward of natural resources and a conscientious partner to the communities where we operate.

Going forward, we will continue to invest in clean energy, water stewardship, and ecosystem restoration. Our passionate, dedicated teams are working every day to honor our promise to future generations. While our journey is ongoing, we remain committed to leading with integrity and transparency.`;

export default function ScannerWorkspace({ onNewAlertTriggered }) {
  const [analyzerMode, setAnalyzerMode] = useState('product');
  const [selectedKey, setSelectedKey] = useState('shampoo');
  const [mode, setMode] = useState('text');
  const [strictness, setStrictness] = useState(78);
  const [userText, setUserText] = useState(MOCK_EXAMPLES.shampoo.text);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeImage, setActiveImage] = useState(MOCK_EXAMPLES.shampoo.imageUrl);
  const [activeCompanyName, setActiveCompanyName] = useState('LushLogistics Co.');
  const [uploadedFile, setUploadedFile] = useState(null);

  const [esgText, setEsgText] = useState(ESG_SAMPLE);
  const [esgScanning, setEsgScanning] = useState(false);
  const [esgResult, setEsgResult] = useState(null);
  const [esgError, setEsgError] = useState(null);

  const activeExample = MOCK_EXAMPLES[selectedKey];

  useEffect(() => {
    setUserText(activeExample.text);
    setMode(activeExample.type);
    setStrictness(activeExample.strictness);
    setScanProgress(0);
    setScanResult(null);
    setActiveImage(activeExample.imageUrl);
    setUploadedFile(null);
  }, [selectedKey]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    resetScan();
    try {
      const data = await api.searchProduct(searchQuery);
      setUserText(`Product: ${data.name}\nBrand: ${data.brand}\nEco Labels: ${data.ecoLabels}\nIngredients: ${data.ingredients}`);
      setActiveCompanyName(data.brand);
      if (data.image) {
        setActiveImage(data.image);
      } else {
        setActiveImage(MOCK_EXAMPLES.shampoo.imageUrl);
      }
    } catch (err) {
      console.error(err);
      setUserText(`Error: Could not find product "${searchQuery}" in Open Food Facts database.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDropdownChange = (e) => {
    setSelectedKey(e.target.value);
  };

  const resetScan = () => {
    setScanProgress(0);
    setScanResult(null);
  };

  const startVisionScan = async () => {
    setScanning(true);
    setScanProgress(0);
    setScanResult(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 150);

    try {
      let result;
      if (mode === 'vision' && uploadedFile) {
        result = await api.scanVision(uploadedFile);
        if (result.extractedText) {
          setUserText(result.extractedText);
        }
      } else {
        result = await api.scanText({
          text: userText,
          strictness,
          company_name: activeCompanyName,
          category: 'Personal Care'
        });
      }

      clearInterval(interval);
      setScanProgress(100);
      setScanResult(result);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setScanProgress(100);
    } finally {
      setScanning(false);
    }
  };

  const runEsgScan = async () => {
    if (!esgText.trim()) {
      setEsgError('Paste an ESG report to grade.');
      return;
    }
    setEsgScanning(true);
    setEsgError(null);
    setEsgResult(null);
    try {
      const result = await api.scanEsg({ text: esgText });
      setEsgResult(result.esgReportCard);
    } catch (err) {
      console.error('[ESG] Scan failed:', err);
      setEsgError(err.message || 'ESG analysis failed.');
    } finally {
      setEsgScanning(false);
    }
  };

  // Render highlighted text
  const renderHighlightedText = () => {
    let text = userText;
    const highlights = scanResult ? scanResult.nlpHighlights : [];

    if (!highlights || highlights.length === 0) {
      return <span>{userText}</span>;
    }

    let parts = [];
    let currentIndex = 0;

    const sorted = [...highlights].sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));

    sorted.forEach((hl, i) => {
      const idx = text.indexOf(hl.text, currentIndex);
      if (idx !== -1) {
        if (idx > currentIndex) {
          parts.push(<span key={`text-${i}`}>{text.substring(currentIndex, idx)}</span>);
        }
        parts.push(
          <span
            key={`hl-${i}`}
            className={`border-b-2 font-bold cursor-help relative group/hl px-0.5 pb-0.5 transition-colors duration-200 ${hl.type === 'critical' ? 'bg-alert-crimson/10 text-alert-crimson border-alert-crimson hover:bg-alert-crimson/20' : 'bg-warning-orange/10 text-warning-orange border-warning-orange hover:bg-warning-orange/20'}`}
          >
            {hl.text}
            <span className="absolute left-0 bottom-full mb-2 hidden group-hover/hl:block w-64 p-3 bg-surface-container border border-whisper-border text-text-ivory rounded shadow-xl text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className={`block font-label-caps text-[9px] mb-1 font-bold ${hl.type === 'critical' ? 'text-alert-crimson' : 'text-warning-orange'}`}>
                {hl.type === 'critical' ? 'CRITICAL VIOLATION' : 'MISLEADING CLAIM'}
              </span>
              {hl.sinType && (
                <span className="inline-block mb-1.5 px-1.5 py-0.5 rounded text-[9px] font-label-caps font-bold border bg-primary/10 text-primary border-primary/30">
                  {hl.sinType}
                </span>
              )}
              {hl.desc}
            </span>
          </span>
        );
        currentIndex = idx + hl.text.length;
      }
    });

    if (currentIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(currentIndex)}</span>);
    }

    return parts.length > 0 ? parts : <span>{userText}</span>;
  };

  const score = scanResult ? scanResult.skepticScore : Math.round(strictness * 1.1 > 100 ? 100 : strictness * 1.1);
  const anomaliesCount = scanResult ? ((scanResult.nlpHighlights?.length || 0) + (scanResult.visionBoxes?.length || 0)) : 0;
  const visionBoxes = scanResult ? (scanResult.visionBoxes || []) : [];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-[10px] text-outline">SCANNER MODE</span>
          <div className="flex bg-[#121C18] p-1 rounded border border-whisper-border">
            <button
              onClick={() => setAnalyzerMode('product')}
              className={`px-4 py-1.5 text-[10px] font-bold font-label-caps rounded transition-all flex items-center gap-1.5 ${analyzerMode === 'product' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-text-ivory'}`}
            >
              <Package className="w-3 h-3" /> PRODUCT SCANNER
            </button>
            <button
              onClick={() => setAnalyzerMode('esg')}
              className={`px-4 py-1.5 text-[10px] font-bold font-label-caps rounded transition-all flex items-center gap-1.5 ${analyzerMode === 'esg' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-text-ivory'}`}
            >
              <FileText className="w-3 h-3" /> ESG REPORT ANALYZER
            </button>
          </div>
        </div>
        {analyzerMode === 'esg' && (
          <div className="font-label-caps text-[10px] text-outline flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-primary" />
            FLUFF VS FACT REPORT CARD
          </div>
        )}
      </div>

      {analyzerMode === 'product' ? (
        <>
          <div className="p-6 bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="space-y-1 w-full md:w-auto">
                <label className="block font-label-caps text-[10px] text-outline uppercase tracking-wider">Search Real Products (Open Food Facts)</label>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by barcode or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#11231c] whisper-border-effect rounded px-4 py-2 text-text-ivory text-sm focus:outline-none focus:border-primary w-full md:w-64 transition-colors"
                  />
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-primary/20 text-primary px-3 py-2 rounded text-xs font-bold hover:bg-primary/30 disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'Fetch'}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto justify-end">
              <div className="flex bg-[#121C18] p-1 rounded border border-whisper-border">
                <button
                  onClick={() => setMode('text')}
                  className={`px-4 py-1.5 text-[10px] font-bold font-label-caps rounded transition-all ${mode === 'text' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-text-ivory'}`}
                >
                  TEXT NLP
                </button>
                <button
                  onClick={() => setMode('vision')}
                  className={`px-4 py-1.5 text-[10px] font-bold font-label-caps rounded transition-all ${mode === 'vision' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-text-ivory'}`}
                >
                  VISION AI
                </button>
              </div>

              <div className="w-full sm:w-48 space-y-2">
                <div className="flex justify-between font-label-caps text-[10px]">
                  <span className="text-outline">STRICTNESS THRESHOLD</span>
                  <span className="text-primary font-bold font-metric-md">{strictness}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={strictness}
                  onChange={(e) => setStrictness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#11231c] rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

      {/* Analyzer Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vision Viewer */}
        <div className="bg-[#0D1713] whisper-border-effect rounded-lg overflow-hidden flex flex-col h-[400px]">
          <div className="p-3 border-b border-whisper-border bg-[#11231c] flex justify-between items-center">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary" /> VISION AI SCANNER</span>
            <span className="font-metric-md text-[10px] text-primary">{scanning ? `SCANNING_${scanProgress}%` : scanProgress === 100 ? 'ANALYSIS_COMPLETE' : 'READY'}</span>
          </div>

          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {mode === 'vision' && !scanning && scanProgress === 0 && (
              <div className="absolute top-4 left-4 z-30">
                <label className="cursor-pointer bg-surface-container/80 backdrop-blur border border-whisper-border text-text-ivory px-3 py-1.5 rounded flex items-center gap-2 font-label-caps text-[9px] hover:bg-surface-variant transition-colors">
                  UPLOAD IMAGE
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadedFile(file);
                        setActiveImage(URL.createObjectURL(file));
                        resetScan();
                      }
                    }}
                  />
                </label>
              </div>
            )}
            <img
              src={activeImage}
              alt="Scanned Target"
              className={`w-full h-full object-contain transition-opacity duration-300 ${scanning ? 'opacity-40' : scanProgress === 100 ? 'opacity-70' : 'opacity-80'}`}
            />

            {/* Animated Laser Scanning Bar */}
            {scanning && (
              <div
                className="absolute left-0 w-full h-[2px] bg-primary z-20 shadow-[0_0_20px_4px_rgba(16,185,129,0.7)]"
                style={{
                  top: `${scanProgress}%`,
                  transition: 'top 0.15s linear'
                }}
              >
                <div className="absolute top-0 left-0 w-full h-[30px] bg-gradient-to-t from-primary/30 to-transparent -translate-y-full pointer-events-none"></div>
              </div>
            )}

            {/* Bounding Box Overlays */}
            {!scanning && scanProgress === 0 && (
              <button
                onClick={startVisionScan}
                className="absolute inset-0 m-auto w-40 h-12 bg-primary/20 backdrop-blur-md hover:bg-primary/30 text-primary font-label-caps text-xs border border-primary/50 rounded flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl"
              >
                <Eye className="w-4 h-4 animate-pulse" />
                Scan Packaging
              </button>
            )}

            {!scanning && scanProgress === 100 && visionBoxes.map((box, i) => (
              <div
                key={i}
                className={`absolute border-2 font-label-caps text-[8px] p-1 flex items-start z-10 transition-all duration-500 animate-in zoom-in-95 fade-in ${box.color}`}
                style={{ ...box.style, animationDelay: `${i * 200}ms`, animationFillMode: 'both' }}
              >
                <span className="absolute -top-5 left-0 bg-inherit border border-inherit px-1.5 py-0.5 rounded-sm whitespace-nowrap text-white font-bold shadow-lg">
                  {box.label}
                </span>
              </div>
            ))}

            {/* Reset Scan Button overlay when complete */}
            {!scanning && scanProgress === 100 && (
              <button
                onClick={resetScan}
                className="absolute top-4 right-4 bg-surface-container/80 backdrop-blur border border-whisper-border text-on-surface-variant hover:text-text-ivory px-3 py-1.5 rounded flex items-center gap-2 font-label-caps text-[9px] transition-colors hover:bg-surface-variant"
              >
                <RefreshCw className="w-3 h-3" />
                RESET SCAN
              </button>
            )}
          </div>
        </div>

        {/* NLP Claims Viewer & Summary */}
        <div className="flex flex-col gap-6 h-[400px]">
          <div className="bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col flex-1">
            <div className="p-3 border-b border-whisper-border bg-[#11231c] flex justify-between items-center">
              <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-primary" /> NLP CLAIMS ANALYSIS</span>
              <span className="font-metric-md text-[10px] text-secondary">LEXICON: ACTIVE</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="block font-label-caps text-[9px] text-outline uppercase">Raw Claim Text</label>
                <textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  className="w-full h-20 p-2.5 bg-[#11231c] border border-whisper-border focus:border-primary rounded text-[11px] text-text-ivory focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="mt-3 space-y-2 pt-3 border-t border-whisper-border flex-1">
                <label className="block font-label-caps text-[9px] text-outline uppercase">Lexicon Matches & Explanations</label>
                <div className="p-3 bg-[#11231c] rounded border border-whisper-border/30 text-[11px] text-text-ivory leading-relaxed overflow-y-auto max-h-32 custom-scrollbar">
                  {renderHighlightedText()}
                </div>
              </div>
            </div>
          </div>

          {/* Scan Result Summary Card */}
          {scanProgress === 100 && scanResult && (
            <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-4 animate-in slide-in-from-bottom-4 fade-in duration-500 flex items-center justify-between">
              <div>
                <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5 mb-1">
                  <AlertTriangle className={`w-3.5 h-3.5 ${score > 75 ? 'text-alert-crimson' : score > 40 ? 'text-warning-orange' : 'text-primary'}`} />
                  Analysis Result
                </span>
                <div className="font-headline-md text-sm font-bold text-text-ivory">
                  {score > 75 ? 'Critical Violation Detected' : score > 40 ? 'Misleading Claims Found' : 'Low Risk / Acceptable'}
                </div>
                <div className="text-[10px] text-outline mt-0.5">
                  Identified {anomaliesCount} potential anomalies
                </div>
              </div>
              <div className="text-right">
                <div className={`font-metric-lg text-2xl font-bold ${score > 75 ? 'text-alert-crimson' : score > 40 ? 'text-warning-orange' : 'text-primary'}`}>
                  {score}
                </div>
                <div className="font-label-caps text-[9px] text-outline">SKEPTIC SCORE</div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      ) : (
        <EsgAnalyzerView
          esgText={esgText}
          setEsgText={setEsgText}
          esgScanning={esgScanning}
          esgResult={esgResult}
          esgError={esgError}
          runEsgScan={runEsgScan}
        />
      )}
    </div>
  );
}

const ESG_GRADE_STYLE = {
  A: 'text-primary border-primary/40 bg-primary/10',
  B: 'text-secondary border-secondary/40 bg-secondary/10',
  C: 'text-warning-orange border-warning-orange/40 bg-warning-orange/10',
  D: 'text-warning-orange border-warning-orange/50 bg-warning-orange/15',
  F: 'text-alert-crimson border-alert-crimson/40 bg-alert-crimson/10'
};

function EsgAnalyzerView({ esgText, setEsgText, esgScanning, esgResult, esgError, runEsgScan }) {
  const wordCount = esgText.trim() ? esgText.trim().split(/\s+/).length : 0;
  const pieData = esgResult
    ? [
        { name: 'Fluff', value: Math.max(0.0001, esgResult.fluffWordCount) },
        { name: 'Substantive', value: Math.max(0.0001, Math.max(0, esgResult.totalWords - esgResult.fluffWordCount)) }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-[#0D1713] whisper-border-effect rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b border-whisper-border bg-[#11231c] flex flex-wrap justify-between items-center gap-3">
          <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" /> ESG REPORT TEXT INPUT
          </span>
          <span className="font-metric-md text-[10px] text-outline">
            {wordCount} WORDS
          </span>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            value={esgText}
            onChange={(e) => setEsgText(e.target.value)}
            placeholder="Paste the body of an ESG or sustainability report here…"
            className="w-full h-72 md:h-96 p-3 bg-[#11231c] border border-whisper-border focus:border-primary rounded text-[12px] text-text-ivory focus:outline-none focus:ring-1 focus:ring-primary resize-y leading-relaxed custom-scrollbar"
          />

          {esgError && (
            <div className="p-2.5 bg-alert-crimson/10 border border-alert-crimson/30 text-alert-crimson text-[11px] rounded font-metric-md">
              {esgError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-label-caps text-[10px] text-outline">
              ENGINE: <span className="text-primary">FLUFF_VS_FACT v1</span>
            </span>
            <button
              onClick={runEsgScan}
              disabled={esgScanning}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary font-label-caps text-[10px] font-bold rounded hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              {esgScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> GRADING…
                </>
              ) : (
                <>
                  <BarChart3 className="w-3.5 h-3.5" /> GENERATE REPORT CARD
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {esgResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-6 flex flex-col items-center justify-center">
            <span className="font-label-caps text-[10px] text-outline">REPORT GRADE</span>
            <div className={`mt-3 w-32 h-32 rounded-full border-4 flex items-center justify-center ${ESG_GRADE_STYLE[esgResult.grade] || ESG_GRADE_STYLE.F}`}>
              <span className="font-metric-lg text-6xl font-bold leading-none">{esgResult.grade}</span>
            </div>
            <span className="mt-3 text-[10px] font-label-caps text-outline text-center">
              {esgResult.grade === 'A' && 'EXEMPLARY TRANSPARENCY'}
              {esgResult.grade === 'B' && 'MEASURABLY SUBSTANTIVE'}
              {esgResult.grade === 'C' && 'FACT-LIGHT — IMPROVE METRICS'}
              {esgResult.grade === 'D' && 'PROMISE-HEAVY / FACT-POOR'}
              {esgResult.grade === 'F' && 'CRITICAL FLUFF DENSITY'}
            </span>
          </div>

          <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-warning-orange" /> FLUFF RATIO
              </span>
              <span className="font-metric-md text-[10px] text-outline">
                {(esgResult.fluffRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#0D1713"
                  >
                    <Cell fill="#F97316" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0d1713', borderColor: 'rgba(16,185,129,0.2)', fontSize: '10px' }}
                    formatter={(v, n) => [v.toFixed(0) + ' words', n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-label-caps">
              <span className="flex items-center gap-1.5 text-warning-orange">
                <span className="w-2.5 h-2.5 rounded-full bg-warning-orange"></span> FLUFF {esgResult.fluffWordCount}
              </span>
              <span className="flex items-center gap-1.5 text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> SUBSTANTIVE {Math.max(0, esgResult.totalWords - esgResult.fluffWordCount)}
              </span>
            </div>
          </div>

          <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-6">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> CORPUS STATS
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                <div className="font-label-caps text-[9px] text-outline">WORDS</div>
                <div className="font-metric-md text-xl font-bold text-text-ivory">{esgResult.totalWords.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                <div className="font-label-caps text-[9px] text-outline">SENTENCES</div>
                <div className="font-metric-md text-xl font-bold text-text-ivory">{esgResult.totalSentences.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                <div className="font-label-caps text-[9px] text-outline">METRICS</div>
                <div className="font-metric-md text-xl font-bold text-primary">{esgResult.concreteMetricCount}</div>
              </div>
              <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                <div className="font-label-caps text-[9px] text-outline">FLUFF WORDS</div>
                <div className="font-metric-md text-xl font-bold text-warning-orange">{esgResult.fluffWordCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-6 lg:col-span-2">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> CONCRETE METRICS DETECTED
            </span>
            {esgResult.concreteMetrics.length === 0 ? (
              <div className="mt-4 p-4 bg-alert-crimson/10 border border-alert-crimson/30 rounded text-alert-crimson text-[11px] flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>No hard metrics detected.</strong> The report contains no percentages, absolute years, emissions figures, or quantitative units. Auditors should flag this as high-risk.
                </span>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {esgResult.concreteMetrics.map((m, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded text-[10px] font-metric-md font-bold"
                    title={m.kind}
                  >
                    {m.value}
                  </span>
                ))}
              </div>
            )}
            {esgResult.concreteSentences.length > 0 && (
              <div className="mt-4">
                <span className="font-label-caps text-[9px] text-outline">EXTRACTED FACT SENTENCES</span>
                <ul className="mt-2 space-y-1.5 text-[11px] text-text-ivory max-h-32 overflow-y-auto custom-scrollbar">
                  {esgResult.concreteSentences.map((s, i) => (
                    <li key={i} className="p-2 bg-[#11231c] rounded border border-whisper-border/30 italic">"{s}"</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-[#0D1713] whisper-border-effect rounded-lg p-6">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-warning-orange" /> FLUFF SENTENCES
            </span>
            {esgResult.fluffSentences.length === 0 ? (
              <div className="mt-4 text-[11px] text-outline italic">
                No high-fluff sentences flagged. Report leans toward measurable language.
              </div>
            ) : (
              <ul className="mt-3 space-y-1.5 text-[11px] text-text-ivory max-h-56 overflow-y-auto custom-scrollbar">
                {esgResult.fluffSentences.map((f, i) => (
                  <li key={i} className="p-2 bg-[#11231c] rounded border border-whisper-border/30">
                    <div className="text-outline italic">"{f.sentence}"</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f.words.slice(0, 4).map((w) => (
                        <span key={w} className="text-[9px] font-label-caps px-1.5 py-0.5 bg-warning-orange/10 text-warning-orange border border-warning-orange/30 rounded">
                          {w}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
