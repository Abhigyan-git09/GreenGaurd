import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword({ setAuthView }) {
  const { resetPassword, error, setError } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('No reset token found in the URL. Please request a new link.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    const result = await resetPassword(token, password);
    if (!mountedRef.current) return;
    setIsLoading(false);
    if (result) {
      setSuccess(true);
      // Clean up URL so the token isn't sitting in the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B08] p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
      </div>
      
      <div className="w-full max-w-md bg-[#0D1713]/80 backdrop-blur-xl rounded-2xl border border-primary/20 p-8 relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.05)] animate-in fade-in zoom-in-95 duration-500">
        
        {!success && (
          <button 
            onClick={() => { setError(null); setAuthView('login'); }}
            className="absolute top-6 left-6 text-outline hover:text-primary transition-colors"
            title="Back to Login"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-3 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-text-ivory tracking-tight">Create New Password</h1>
          <p className="text-outline text-sm mt-1 text-center font-medium">
            Please enter your new secure access key.
          </p>
        </div>

        {error && !success && (
          <div className="mb-6 p-3 bg-error-container/20 border border-alert-crimson/30 rounded text-alert-crimson text-xs text-center font-metric-md animate-in shake">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-text-ivory font-bold text-lg mb-2">Password Reset Successful</h3>
            <p className="text-outline text-sm mb-8">
              Your password has been securely updated. You can now log into your account with your new credentials.
            </p>
            <button
              onClick={() => setAuthView('login')}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase font-bold">New Secure Access Key</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token}
                  className="w-full px-4 py-3 bg-[#050B08] border border-whisper-border focus:border-primary rounded-lg text-text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-text-ivory transition-colors disabled:opacity-50"
                  disabled={!token}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-6 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
