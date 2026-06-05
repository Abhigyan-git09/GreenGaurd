import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for effect
    setTimeout(async () => {
      await login(email, password);
      setIsLoading(false);
    }, 800);
  };

  const fillCredentials = (role) => {
    setEmail(`${role}@greengaurd.org`);
    setPassword(`${role}123`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B08] p-4 font-sans relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(0,0,0,0))]"></div>
      </div>
      
      <div className="w-full max-w-md bg-[#0D1713]/80 backdrop-blur-xl rounded-2xl border border-primary/20 p-8 relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.05)] animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-3 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-headline-xl text-3xl font-bold text-text-ivory tracking-tight">GreenGaurd</h1>
          <p className="text-outline text-sm mt-1 text-center font-medium">Forensic Greenwashing Verification</p>
          <p className="text-[10px] text-outline/70 mt-1.5 max-w-[250px] text-center italic">
            Connecting consumer audits with sustainability compliance
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container/20 border border-alert-crimson/30 rounded text-alert-crimson text-xs text-center font-metric-md animate-in shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase">Authentication Identifier</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. auditor@greengaurd.org"
              required
              className="w-full px-4 py-3 bg-[#050B08] border border-whisper-border focus:border-primary rounded-lg text-text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase font-bold">Secure Access Key</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-[#050B08] border border-whisper-border focus:border-primary rounded-lg text-text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-text-ivory transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Access Dashboard"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-whisper-border text-center">
          <p className="font-label-caps text-[10px] text-outline tracking-wider uppercase mb-3">Pre-seeded Mock Credentials</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('consumer')}
              className="py-1.5 px-1 bg-surface-container whisper-border-effect rounded hover:bg-surface-variant text-[10px] font-label-caps text-secondary transition-colors"
            >
              Consumer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('auditor')}
              className="py-1.5 px-1 bg-surface-container whisper-border-effect rounded hover:bg-surface-variant text-[10px] font-label-caps text-primary transition-colors"
            >
              Auditor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="py-1.5 px-1 bg-surface-container whisper-border-effect rounded hover:bg-surface-variant text-[10px] font-label-caps text-warning-orange transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
