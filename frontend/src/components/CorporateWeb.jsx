/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, ZoomIn, ZoomOut, Maximize2, RefreshCw, Building2, Leaf } from 'lucide-react';
import api from '../utils/api';

export default function CorporateWeb() {
  const fgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState({ nodes: [], links: [], stats: { totalNodes: 0, totalLinks: 0, totalIncidents: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCorporateNetwork();
      const nodes = (result.nodes || []).map((n) => ({ ...n }));
      const links = (result.links || []).map((l) => ({ ...l }));
      setData({ nodes, links, stats: result.stats || { totalNodes: nodes.length, totalLinks: links.length, totalIncidents: 0 } });
    } catch (err) {
      console.error('[CORP WEB] Fetch failed:', err);
      setError(err.message || 'Failed to load corporate network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (data.nodes.length === 0 && !error) {
      fetchNetwork();
    }
  }, [fetchNetwork]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.max(320, width), height: Math.max(400, height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-260);
      fgRef.current.d3Force('link').distance(90);
      fgRef.current.d3ReheatSimulation();
    }
  }, [data]);

  const handleNodeClick = useCallback((node) => {
    setSelected(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(2.4, 600);
    }
  }, []);

  const handleZoomIn = () => fgRef.current?.zoom((fgRef.current?.zoom() || 1) * 1.4, 300);
  const handleZoomOut = () => fgRef.current?.zoom((fgRef.current?.zoom() || 1) / 1.4, 300);
  const handleCenter = () => fgRef.current?.zoomToFit(400, 60);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isParent = node.group === 'parent';
    const r = isParent ? 10 : 5;
    const fill = isParent ? '#EF4444' : '#10B981';
    const stroke = isParent ? '#7f1d1d' : '#064e3b';

    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 1.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.5 / globalScale;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    if (globalScale > 1.2 || isParent) {
      const label = node.id;
      const fontSize = isParent ? 12 / globalScale : 9 / globalScale;
      ctx.font = `${isParent ? 'bold ' : ''}${fontSize}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isParent ? '#ECFDF5' : '#bbcabf';
      ctx.fillText(label, node.x, node.y + r + 2);
    }
  }, []);

  const pointerAreaPaint = useCallback((node, color, ctx) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const graphData = useMemo(() => data, [data]);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-alert-crimson/10 border border-alert-crimson/30 flex items-center justify-center">
            <Network className="w-6 h-6 text-alert-crimson" />
          </div>
          <div>
            <h2 className="font-headline-md text-lg font-bold text-text-ivory">The Illusion of Choice</h2>
            <p className="text-outline text-xs mt-0.5 max-w-xl">
              Force-directed map of "independent" eco-brands and their parent corporations. Drag nodes to explore, click to focus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#11231c] whisper-border-effect rounded border">
            <span className="font-metric-md text-[10px] text-outline">NODES</span>
            <span className="font-metric-md text-[10px] font-bold text-text-ivory">{data.stats.totalNodes}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#11231c] whisper-border-effect rounded border">
            <span className="font-metric-md text-[10px] text-outline">LINKS</span>
            <span className="font-metric-md text-[10px] font-bold text-text-ivory">{data.stats.totalLinks}</span>
          </div>
          <button
            onClick={fetchNetwork}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary font-label-caps text-[10px] font-bold rounded hover:brightness-110 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-[#0D1713] whisper-border-effect rounded-lg overflow-hidden flex flex-col h-[640px]">
          <div className="p-3 border-b border-whisper-border bg-[#11231c] flex justify-between items-center">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-primary" /> CORPORATE WEB — FORCE GRAPH
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={handleZoomIn} className="p-1.5 bg-[#121C18] hover:bg-surface-variant rounded border border-whisper-border text-on-surface-variant hover:text-text-ivory transition-colors" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut} className="p-1.5 bg-[#121C18] hover:bg-surface-variant rounded border border-whisper-border text-on-surface-variant hover:text-text-ivory transition-colors" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCenter} className="p-1.5 bg-[#121C18] hover:bg-surface-variant rounded border border-whisper-border text-on-surface-variant hover:text-text-ivory transition-colors" title="Fit to view">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div ref={containerRef} className="relative flex-1 bg-[#050B08]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#050B08]/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-primary">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="font-label-caps text-[10px]">MAPPING CORP GRAPH…</span>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 p-6 text-center">
                <div className="text-alert-crimson text-xs">
                  <p className="font-label-caps text-[10px] mb-1">FAILED TO LOAD NETWORK</p>
                  <p className="text-outline">{error}</p>
                  <button onClick={fetchNetwork} className="mt-3 px-3 py-1.5 border border-alert-crimson/30 text-alert-crimson rounded font-label-caps text-[10px] hover:bg-alert-crimson/10">
                    RETRY
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && data.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 text-center text-outline text-xs px-6">
                No corporate relationships detected in the database yet. Run scans or add incidents to populate the web.
              </div>
            )}

            {!loading && !error && data.nodes.length > 0 && (
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={size.width}
                height={size.height}
                backgroundColor="#050B08"
                nodeRelSize={6}
                linkColor={() => 'rgba(16, 185, 129, 0.35)'}
                linkWidth={(l) => Math.min(1 + l.value * 0.6, 4)}
                linkDirectionalParticles={(l) => Math.min(l.value, 3)}
                linkDirectionalParticleSpeed={() => 0.006}
                linkDirectionalParticleColor={() => '#7cd8b6'}
                linkDirectionalParticleWidth={2}
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={pointerAreaPaint}
                onNodeClick={handleNodeClick}
                onNodeHover={setHovered}
                enableNodeDrag={true}
                cooldownTicks={140}
                d3AlphaDecay={0.025}
                d3VelocityDecay={0.32}
                warmupTicks={60}
              />
            )}

            {hovered && !selected && (
              <div className="absolute top-3 left-3 z-30 px-3 py-2 bg-surface-container/90 backdrop-blur border border-whisper-border rounded text-[10px] font-label-caps">
                <span className={hovered.group === 'parent' ? 'text-alert-crimson' : 'text-primary'}>
                  {hovered.group === 'parent' ? 'PARENT CORP' : 'SUBSIDIARY'}
                </span>
                <span className="text-text-ivory ml-1.5">{hovered.id}</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-whisper-border bg-[#11231c] flex flex-wrap items-center justify-between gap-3 text-[10px] font-label-caps">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-alert-crimson"></span> PARENT CORP
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> ECO-SUBSIDIARY
              </span>
              <span className="flex items-center gap-1.5 text-outline">
                <span className="w-2 h-px bg-primary/60"></span> OWNERSHIP LINK
              </span>
            </div>
            <span className="text-outline">DRAG · SCROLL · CLICK A NODE</span>
          </div>
        </div>

        <div className="xl:col-span-1 bg-[#0D1713] whisper-border-effect rounded-lg flex flex-col h-[640px]">
          <div className="p-3 border-b border-whisper-border bg-[#11231c]">
            <span className="font-label-caps text-[10px] text-outline flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" /> NODE INSPECTOR
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {selected ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <div>
                  <span className={`font-label-caps text-[9px] px-1.5 py-0.5 rounded border inline-block ${
                    selected.group === 'parent'
                      ? 'bg-alert-crimson/10 text-alert-crimson border-alert-crimson/30'
                      : 'bg-primary/10 text-primary border-primary/30'
                  }`}>
                    {selected.group === 'parent' ? 'PARENT CORPORATION' : 'SUBSIDIARY BRAND'}
                  </span>
                  <h3 className="font-headline-md text-base font-bold text-text-ivory mt-2 break-words">{selected.id}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                    <div className="font-label-caps text-[9px] text-outline">INCIDENTS</div>
                    <div className="font-metric-md text-lg font-bold text-text-ivory">{selected.incidentCount || 0}</div>
                  </div>
                  {selected.group === 'parent' && (
                    <div className="p-3 bg-[#11231c] rounded border border-whisper-border">
                      <div className="font-label-caps text-[9px] text-outline">ECO KIDS</div>
                      <div className="font-metric-md text-lg font-bold text-primary">{selected.childCount || 0}</div>
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-label-caps text-[9px] text-outline block mb-1.5">CONNECTED ENTITIES</span>
                  <div className="space-y-1.5">
                    {data.links
                      .filter((l) => {
                        const s = typeof l.source === 'object' ? l.source.id : l.source;
                        const t = typeof l.target === 'object' ? l.target.id : l.target;
                        return s === selected.id || t === selected.id;
                      })
                      .slice(0, 12)
                      .map((l, i) => {
                        const s = typeof l.source === 'object' ? l.source.id : l.source;
                        const t = typeof l.target === 'object' ? l.target.id : l.target;
                        const other = s === selected.id ? t : s;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              const node = data.nodes.find((n) => n.id === other);
                              if (node) handleNodeClick(node);
                            }}
                            className="w-full flex items-center justify-between p-2 bg-[#121C18] hover:bg-surface-variant rounded border border-whisper-border text-left transition-colors"
                          >
                            <span className="text-text-ivory text-[11px] truncate">{other}</span>
                            <span className="font-metric-md text-[9px] text-primary ml-2">×{l.value}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelected(null);
                    handleCenter();
                  }}
                  className="w-full py-2 border border-whisper-border hover:bg-surface-variant text-on-surface-variant hover:text-text-ivory font-label-caps text-[10px] rounded transition-colors"
                >
                  CLEAR SELECTION
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-outline text-xs gap-2 py-12">
                <Leaf className="w-8 h-8 text-whisper-border" />
                <p>Click any node on the graph to inspect ownership chains and incident density.</p>
                <p className="text-[10px] text-outline/70 mt-1">Red = Parent Corp · Green = Eco-Subsidiary</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
