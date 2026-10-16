import React, { useState } from 'react';
import { Truck, LogIn, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTransport } from '../../store/TransportContext';

interface LoginViewProps {
  onLogin: (username: string, pass: string, rememberMe?: boolean) => boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { resetAdminCredentials, adminCredentials } = useTransport();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    const success = onLogin(username.trim(), password.trim(), rememberMe);
    if (!success) {
      setErrorMsg(`Invalid credentials. Current login is: ${adminCredentials.username}`);
    }
  };

  const handleQuickDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    const success = onLogin('admin', 'admin123', true);
    if (!success) {
      resetAdminCredentials();
      onLogin('admin', 'admin123', true);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset administrator login credentials back to default (admin / admin123)?')) {
      resetAdminCredentials();
      setUsername('admin');
      setPassword('admin123');
      setErrorMsg('');
      setInfoMsg('Credentials reset to default: admin / admin123');
      setTimeout(() => setInfoMsg(''), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4">
      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
            ANORI TRANSPORT
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Transport Fleet Management &amp; Invoicing ERP
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (admin)"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (admin123)"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me on this browser</span>
            </label>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
            >
              Reset to Default
            </button>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In to Anori Transport</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center space-y-2">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
          >
            → Quick 1-Click Demo Login
          </button>
          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
            <span>Default: admin / admin123</span>
            <span>•</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Secure Local Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
