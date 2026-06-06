import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export default function Register({ setAuthView }) {
  const { register, error, setError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await register(email, password, fullName, 'auditor');
    if (mountedRef.current) setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B08] p-4 font-sans relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>
      
      <div className="w-full max-w-md bg-[#0D1713]/80 backdrop-blur-xl rounded-2xl border border-primary/20 p-8 relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.05)] animate-in fade-in zoom-in-95 duration-500">
        
        <button 
          onClick={() => { setError(null); setAuthView('login'); }}
          className="absolute top-6 left-6 text-outline hover:text-primary transition-colors"
          title="Back to Login"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-3 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-headline-xl text-3xl font-bold text-text-ivory tracking-tight">Register</h1>
          <p className="text-outline text-sm mt-1 text-center font-medium">Create your GreenGaurd Auditor Account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container/20 border border-alert-crimson/30 rounded text-alert-crimson text-xs text-center font-metric-md animate-in shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
              className="w-full px-4 py-3 bg-[#050B08] border border-whisper-border focus:border-primary rounded-lg text-text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase">Authentication Identifier (Email)</label>
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
            <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase font-bold">Secure Access Key (Password)</label>
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
            className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-6 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-outline">
            Already have an account?{' '}
            <button
              onClick={() => { setError(null); setAuthView('login'); }}
              className="text-primary hover:text-primary/80 font-bold transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
