import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import ScannerWorkspace from './components/ScannerWorkspace';
import LiveAlertFeed from './components/LiveAlertFeed';
import AnalyticsPanel from './components/AnalyticsPanel';
import CorporateDatabase from './components/CorporateDatabase';
import CorporateWeb from './components/CorporateWeb';
import api from './utils/api';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  FileSpreadsheet, 
  LogOut, 
  ShieldAlert, 
  Search,
  Bell,
  Cpu,
  UserCheck,
  Menu,
  X,
  Loader2,
  Network
} from 'lucide-react';

export default function App() {
  const { user, logout, switchRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  const [incidents, setIncidents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ── Fetch incidents from backend ──────────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    if (!user) return;
    setLoadingIncidents(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('[APP] Failed to fetch incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchIncidents();
    }
  }, [user, fetchIncidents]);

  // ── WebSocket Connection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    function connect() {
      const wsUrl = api.getWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to live feed');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NEW_ALERT') {
            setLiveAlerts(prev => [data.alert, ...prev.slice(0, 9)]);
          }

          if (data.type === 'STATUS_CHANGE') {
            // Update the incidents list when a status changes
            setIncidents(prev => prev.map(inc => 
              inc.id === data.incidentId ? { ...inc, status: data.newStatus } : inc
            ));
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [user]);

  // ── Show loading spinner while checking auth ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050B08]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // ── Handle Auditor actions via API ────────────────────────────────────────
  const handleVerifyClaim = async (alertId) => {
    const alert = liveAlerts.find(a => a.id === alertId);
    if (!alert) return;

    // Optimistically remove from live feed
    setLiveAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const verified = await api.verifyIncident(alertId);
      // Add the verified incident to our local list
      setIncidents(prev => [verified, ...prev]);
    } catch (err) {
      console.error('[APP] Verify failed:', err);
      // On failure, put it back
      setLiveAlerts(prev => [alert, ...prev]);
    }
  };

  const handleRejectClaim = async (alertId) => {
    const alert = liveAlerts.find(a => a.id === alertId);
    if (!alert) return;

    setLiveAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const rejected = await api.rejectIncident(alertId);
      setIncidents(prev => [rejected, ...prev]);
    } catch (err) {
      console.error('[APP] Reject failed:', err);
      setLiveAlerts(prev => [alert, ...prev]);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    try {
      await api.deleteIncident(incidentId);
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
    } catch (err) {
      console.error('[APP] Delete failed:', err);
    }
  };

  const handleNewScanAlert = (newAlert) => {
    // The scan endpoint broadcasts via WebSocket, so this is now handled by the WS listener.
    // But we also optimistically add it to the local live feed for instant feedback.
    setLiveAlerts(prev => [newAlert, ...prev]);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab === 'database' || tab === 'analytics') {
      fetchIncidents();
    }
  };

  const criticalAlertsCount = incidents.filter(i => i.severity === 'Critical' && i.status === 'Verified').length;

  return (
    <div className="min-h-screen flex bg-[#050B08] text-[#d2e7dd] font-sans antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(0,0,0,0))]"></div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-full w-64 lg:w-sidebar-width bg-[#050B08] border-r border-whisper-border flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <span className="font-headline-xl text-lg font-bold text-primary tracking-tight">GreenGaurd</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
          </div>
          <button className="lg:hidden text-outline hover:text-text-ivory" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1 px-3">
            <button
              onClick={() => switchTab('scanner')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 group text-left rounded-md ${
                activeTab === 'scanner' 
                  ? 'text-primary font-bold border-r-2 border-primary bg-[#11231c]' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="font-label-caps text-xs">Scanner Center</span>
            </button>
            
            <button
              onClick={() => switchTab('database')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 group text-left rounded-md ${
                activeTab === 'database' 
                  ? 'text-primary font-bold border-r-2 border-primary bg-[#11231c]' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="font-label-caps text-xs">Offender DB</span>
            </button>

            <button
              onClick={() => switchTab('network')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 group text-left rounded-md ${
                activeTab === 'network' 
                  ? 'text-alert-crimson font-bold border-r-2 border-alert-crimson bg-[#11231c]' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-alert-crimson'
              }`}
            >
              <Network className="w-4 h-4" />
              <span className="font-label-caps text-xs">Corporate Web</span>
            </button>

            <button
              onClick={() => switchTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 group text-left rounded-md ${
                activeTab === 'analytics' 
                  ? 'text-primary font-bold border-r-2 border-primary bg-[#11231c]' 
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-label-caps text-xs">Analytics Telemetry</span>
            </button>
          </div>
        </nav>

        {/* Role Access Controller & Logged user */}
        <div className="p-4 border-t border-whisper-border bg-[#05110b]">
          <div className="mb-4">
            <label className="block font-label-caps text-[9px] text-outline tracking-wider uppercase mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-primary" /> Active Identity (RBAC)
            </label>
            <select
              value={user.role}
              onChange={(e) => switchRole(e.target.value)}
              className="w-full bg-[#11231c] text-text-ivory font-label-caps text-[10px] px-2 py-1.5 rounded whisper-border-effect focus:outline-none focus:border-primary cursor-pointer border"
            >
              <option value="consumer">CONSUMER MODE</option>
              <option value="auditor">AUDITOR UNIT</option>
              {user.role === 'admin' && <option value="admin">SYSTEM ADMIN</option>}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#11231c] border border-whisper-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-text-ivory font-bold text-xs">
                {user.fullName ? user.fullName[0] : '?'}
              </div>
              <div className="text-left">
                <div className="text-text-ivory font-bold text-xs leading-none">{user.fullName}</div>
                <div className="text-outline text-[9px] font-label-caps mt-1">{user.title}</div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-outline hover:text-alert-crimson transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 lg:ml-sidebar-width min-h-screen flex flex-col z-10 relative w-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-[#050B08]/80 backdrop-blur-md border-b border-whisper-border h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-text-ivory hover:text-primary transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-label-caps">
              <span className="text-on-surface-variant tracking-widest">GREENGAURD COMPLIANCE</span>
              <span className="text-whisper-border">/</span>
              <span className="text-primary animate-pulse">{activeTab.toUpperCase()}_UNIT</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 border-r border-whisper-border pr-6">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-label-caps text-outline">VERIFIED INCIDENTS</span>
                <span className="text-xs font-bold font-metric-md text-text-ivory">{incidents.length}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-label-caps text-outline">CRITICAL RISK</span>
                <span className="text-xs font-bold font-metric-md text-alert-crimson">{criticalAlertsCount}</span>
              </div>
            </div>

            <button 
              onClick={() => switchTab('scanner')}
              title="View Live Alerts"
              className="relative text-on-surface-variant hover:text-primary transition-colors"
            >
              <Bell className="w-5 h-5" />
              {liveAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-alert-crimson text-white text-[8px] font-bold flex items-center justify-center rounded-full animate-in zoom-in shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                  {liveAlerts.length > 9 ? '9+' : liveAlerts.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 p-4 lg:p-6 w-full max-w-[1600px] mx-auto overflow-y-auto">
          {activeTab === 'scanner' && (
            <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="w-full xl:w-[65%]">
                <ScannerWorkspace onNewAlertTriggered={handleNewScanAlert} />
              </div>
              <div className="w-full xl:w-[35%] h-[500px] xl:h-auto">
                <LiveAlertFeed 
                  alerts={liveAlerts}
                  onVerify={handleVerifyClaim}
                  onReject={handleRejectClaim}
                  userRole={user.role}
                />
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              {loadingIncidents ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <CorporateDatabase 
                  data={incidents} 
                  onRemove={user.role === 'admin' ? handleDeleteIncident : null} 
                />
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <CorporateWeb />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="p-6 bg-[#0D1713] whisper-border-effect rounded-lg">
                <h2 className="font-headline-md text-lg font-bold text-text-ivory mb-2">Telemetry Dashboard</h2>
                <p className="text-outline text-xs">Real-time charts calculated from the verified greenwashing databases.</p>
              </div>
              <AnalyticsPanel data={incidents} />
            </div>
          )}
        </div>

        {/* Global Database preview footer if in Scanner page */}
        {activeTab === 'scanner' && (
          <footer className="bg-[#05110b]/60 border-t border-whisper-border p-4 lg:p-6 mt-6 xl:mt-12 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-sm font-bold text-text-ivory">Accountability Preview (Latest Logs)</h2>
              <button 
                onClick={() => switchTab('database')} 
                className="text-primary font-label-caps text-[10px] hover:underline"
              >
                Go to Full Database
              </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-body-sm text-xs border-separate border-spacing-y-2 min-w-[600px]">
                <thead>
                  <tr className="text-outline font-label-caps text-[9px]">
                    <th className="px-4 py-2 font-bold">Corporation</th>
                    <th className="px-4 py-2 font-bold">Parent Entity</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold text-right">Skeptic Score</th>
                    <th className="px-4 py-2 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 3).map((item) => (
                    <tr key={item.id} className="bg-[#121C18] hover:bg-[#1b2e27]/40 transition-colors whisper-border-effect rounded">
                      <td className="px-4 py-2 text-text-ivory font-bold">{item.productName}</td>
                      <td className="px-4 py-2 text-on-surface-variant">{item.parentCorporation}</td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        <span className="bg-[#11231c] px-2 py-0.5 rounded text-primary text-[10px] border border-whisper-border inline-block">
                          {item.category}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-metric-md font-bold ${
                        item.skepticScore > 75 ? 'text-alert-crimson' : item.skepticScore > 40 ? 'text-warning-orange' : 'text-secondary'
                      }`}>{item.skepticScore}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-[8px] font-label-caps px-2 py-0.5 border rounded-sm inline-block ${
                          item.status === 'Verified' ? 'bg-alert-crimson/10 text-alert-crimson border-alert-crimson/20' : 'bg-warning-orange/10 text-warning-orange border-warning-orange/20'
                        }`}>{item.status === 'Verified' ? 'FLAGGED' : 'PENDING'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
