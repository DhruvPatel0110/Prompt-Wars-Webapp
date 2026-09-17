import React, { useState } from 'react';
import { ShieldCheck, Lock, ChevronRight, AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const AdminLoginPage = ({ onSwitchToStudent }) => {
  const { loginAdmin, adminAuthError, isAuthenticating } = useAuth();
  const { isConnected, latency } = useSocket();
  const [adminPin, setAdminPin] = useState('admin123');

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    await loginAdmin(adminPin);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-[0_0_30px_rgba(255,184,0,0.4)] mb-4 animate-pulse">
            <div className="w-full h-full bg-[#070a13] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-wider text-white">
            HOST <span className="text-amber-400">COMMAND CENTER</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-mono">
            Authoritative Tournament Management & Evaluation
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1424] border border-[#1f2b48] text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? `SERVER ONLINE (${latency}ms)` : 'CONNECTING TO SERVER...'}
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#0c101d] border border-amber-500/30 shadow-[0_0_40px_rgba(255,184,0,0.15)]">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Judge & Organizer Authorization</span>
          </div>

          {adminAuthError && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{adminAuthError}</span>
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 mb-1.5">
                Host Master Passcode:
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Host PIN (e.g. admin123)"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#070a13] border border-amber-500/30 text-white font-mono focus:outline-none focus:border-amber-400 shadow-inner"
                />
                <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                Default Master PIN: <span className="text-amber-400 font-bold">admin123</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !isConnected}
              className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,184,0,0.4)] disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{isAuthenticating ? 'VERIFYING CREDENTIALS...' : 'ACCESS HOST CONTROL ROOM'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800 text-center">
            <button
              type="button"
              onClick={onSwitchToStudent}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch to Student Arena</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
