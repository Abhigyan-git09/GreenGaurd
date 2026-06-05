import React from 'react';
import { Activity, Sparkles, XCircle, CheckCircle } from 'lucide-react';

export default function LiveAlertFeed({ alerts, onVerify, onReject, userRole }) {
  
  return (
    <div className="bg-[#0D1713] rounded-lg whisper-border-effect flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-whisper-border bg-[#11231c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-headline-md text-base font-bold text-text-ivory flex items-center gap-2">
            <Activity className="w-4 h-4 text-alert-crimson animate-pulse" />
            Live Flag Feed
          </h2>
          {alerts.length > 0 && (
            <span className="bg-alert-crimson/20 text-alert-crimson font-metric-md text-[10px] font-bold px-2 py-0.5 rounded-full border border-alert-crimson/30">
              {alerts.length}
            </span>
          )}
        </div>
        <span className="font-label-caps text-[9px] text-primary bg-[#121C18] border border-whisper-border px-2 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
          STREAM_LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[500px] lg:max-h-[640px]">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-outline text-xs animate-in fade-in duration-700">
            <Sparkles className="w-8 h-8 text-whisper-border mb-2 animate-bounce" />
            Waiting for crowd-sourced scans...
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={alert.id}
              className={`p-4 bg-[#121C18] rounded whisper-border-effect border-l-4 transition-all duration-300 transform scale-100 hover:scale-[1.02] animate-in slide-in-from-right-8 fade-in ${
                alert.severity === 'Critical'
                  ? 'border-alert-crimson'
                  : alert.severity === 'Medium'
                  ? 'border-warning-orange'
                  : 'border-secondary'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`font-label-caps text-[9px] uppercase font-bold flex items-center gap-1 ${
                      alert.severity === 'Critical'
                        ? 'text-alert-crimson animate-pulse'
                        : alert.severity === 'Medium'
                        ? 'text-warning-orange'
                        : 'text-secondary'
                    }`}
                  >
                    {alert.severity === 'Critical' && (
                      <span className="w-1.5 h-1.5 bg-alert-crimson rounded-full animate-ping"></span>
                    )}
                    {alert.severity} Incident
                  </span>
                  <h3 className="font-headline-md text-sm font-bold text-text-ivory mt-1">{alert.companyName}</h3>
                  <span className="text-[10px] text-outline italic">Parent: {alert.parentCorporation}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-metric-lg text-lg font-bold ${
                      alert.severity === 'Critical'
                        ? 'text-alert-crimson'
                        : alert.severity === 'Medium'
                        ? 'text-warning-orange'
                        : 'text-secondary'
                    }`}
                  >
                    {alert.skepticScore}
                  </span>
                  <div className="text-[8px] font-label-caps text-outline">SCORE</div>
                </div>
              </div>

              <div className="text-xs text-outline leading-relaxed line-clamp-2 mb-3 bg-[#0D1713]/50 p-2 rounded border border-whisper-border/30 italic">
                &quot;{alert.text_content}&quot;
              </div>

              <div className="flex items-center justify-between text-[10px] text-outline border-t border-whisper-border/30 pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                  {alert.category}
                </span>
                <span>{alert.timestamp}</span>
              </div>

              {/* Auditor & Admin Actions */}
              {(userRole === 'auditor' || userRole === 'admin') && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-whisper-border/20">
                  <button
                    onClick={() => onVerify(alert.id)}
                    className="flex-1 bg-primary text-on-primary font-bold font-label-caps text-[9px] py-2 rounded flex items-center justify-center gap-1 transition-all hover:brightness-110 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Verify Claim
                  </button>
                  <button
                    onClick={() => onReject(alert.id)}
                    className="px-3 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-text-ivory font-bold font-label-caps text-[9px] rounded flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
