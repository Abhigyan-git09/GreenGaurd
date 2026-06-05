import React, { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Eye, Cpu, Sliders, ChevronDown, RefreshCw, AlertTriangle } from 'lucide-react';
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

export default function ScannerWorkspace({ onNewAlertTriggered }) {
  const [selectedKey, setSelectedKey] = useState('shampoo');
  const [mode, setMode] = useState('text'); // 'text' | 'vision'
  const [strictness, setStrictness] = useState(78);
  const [userText, setUserText] = useState(MOCK_EXAMPLES.shampoo.text);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  const activeExample = MOCK_EXAMPLES[selectedKey];

  useEffect(() => {
    setUserText(activeExample.text);
    setMode(activeExample.type);
    setStrictness(activeExample.strictness);
    setScanProgress(0);
    setScanResult(null);
  }, [selectedKey]);

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
      const company_name = selectedKey === 'shampoo' ? 'LushLogistics Co.' : selectedKey === 'fashion' ? 'ConsciousThreads' : 'AirGlide International';
      const category = selectedKey === 'shampoo' ? 'Personal Care' : selectedKey === 'fashion' ? 'Apparel' : 'Aviation';

      const result = await api.scanText({
        text: userText,
        strictness,
        company_name,
        category
      });

      clearInterval(interval);
      setScanProgress(100);
      setScanResult(result);
      
      // The backend WebSocket will broadcast the NEW_ALERT to App.jsx automatically.
      // If we wanted to optimistically add it, we could call onNewAlertTriggered here.
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setScanProgress(100); // Fail gracefully
    } finally {
      setScanning(false);
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
      {/* Control Header */}
      <div className="p-6 bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="space-y-1 w-full md:w-auto">
            <label className="block font-label-caps text-[10px] text-outline uppercase tracking-wider">Active Analysis Target</label>
            <div className="relative">
              <select
                value={selectedKey}
                onChange={handleDropdownChange}
                className="appearance-none bg-[#11231c] whisper-border-effect rounded px-4 py-2 text-text-ivory font-headline-md text-sm pr-10 focus:outline-none focus:border-primary cursor-pointer w-full md:w-64 transition-colors hover:bg-surface-variant"
              >
                <option value="shampoo">Organic Shampoo Bottle</option>
                <option value="fashion">Fast Fashion Eco-Tag</option>
                <option value="flight">Net-Zero Flight Banner</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            </div>
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
            <img
              src={activeExample.imageUrl}
              alt={activeExample.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${scanning ? 'opacity-40' : scanProgress === 100 ? 'opacity-70' : 'opacity-80'}`}
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
    </div>
  );
}
