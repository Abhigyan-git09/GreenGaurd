import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ setAuthView }) {
  const { forgotPassword, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);
    if (result) {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050B08] p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
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
          <div className="w-12 h-12 rounded-xl bg-warning-orange/10 flex items-center justify-center mb-3 text-warning-orange shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-text-ivory tracking-tight">Reset Password</h1>
          <p className="text-outline text-sm mt-1 text-center font-medium px-4">
            Enter your email and we'll send you a secure link to reset your password.
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
            <h3 className="text-text-ivory font-bold text-lg mb-2">Request Sent</h3>
            <p className="text-outline text-sm mb-8">
              If an account exists for <strong>{email}</strong>, a password reset link has been generated.
              <br /><br />
              <span className="text-xs text-primary/80 italic">(Since this is a demo, check the backend server logs for the simulated email link!)</span>
            </p>
            <button
              onClick={() => setAuthView('login')}
              className="w-full h-12 bg-surface-container hover:bg-surface-variant text-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-label-caps text-[10px] text-outline tracking-wider uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. auditor@greengaurd.org"
                required
                className="w-full px-4 py-3 bg-[#050B08] border border-whisper-border focus:border-primary rounded-lg text-text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-label-caps font-bold text-xs rounded-lg uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-6 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
