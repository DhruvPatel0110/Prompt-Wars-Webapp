import React, { useState } from 'react';
import { Zap, Lock, ChevronRight, AlertCircle, Shield, Users, Hash, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const LoginPage = ({ onSwitchToAdmin }) => {
  const { loginTeam, authError, isAuthenticating } = useAuth();
  const { isConnected, latency } = useSocket();

  const [teamName, setTeamName] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [teamPin, setTeamPin] = useState('');

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const cleanName = teamName.trim();
    const cleanNum = teamNumber.trim();
    const cleanPin = teamPin.trim() || '1234';

    if (!cleanName && !cleanNum) {
      alert('Please enter your Team Name or Team Number.');
      return;
    }

    await loginTeam({
      teamName: cleanName,
      teamNumber: cleanNum,
      pin: cleanPin
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Championship Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(0,240,255,0.4)] mb-4 animate-cyber-pulse">
            <div className="w-full h-full bg-[#070a13] rounded-[14px] flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400" />
            </div>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-wider text-white">
            PROMPT<span className="text-cyan-400">WARS</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-sans">
            AI Prompt Engineering Championship • Team Arena
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1424] border border-[#1f2b48] text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? `SERVER ONLINE (${latency}ms)` : 'CONNECTING TO SERVER...'}
            </span>
          </div>
        </div>

        {/* Team Auth & Dynamic Registration Card */}
        <div className="cyber-card rounded-2xl p-6 sm:p-8 border-cyan-500/40">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#1f2b48]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-sm tracking-wider text-white uppercase">
              Team Registration / Login
            </span>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleTeamSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Team Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Prompt Wizards, Neural Ninjas"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-sans focus:outline-none focus:border-cyan-500/50"
                />
                <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Team / Table #:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 01, 12, T-5"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Access PIN:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="4-digit PIN"
                    value={teamPin}
                    onChange={(e) => setTeamPin(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-mono tracking-widest focus:outline-none focus:border-cyan-500/50"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 font-sans pt-1">
              Entering the arena registers your team live in the Host Dashboard. Keep your PIN to reconnect if you refresh.
            </p>

            <button
              type="submit"
              disabled={isAuthenticating || !isConnected}
              className="cyber-btn w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'ENTERING ARENA...' : 'ENTER TOURNAMENT ARENA'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          {onSwitchToAdmin && (
            <div className="mt-6 pt-4 border-t border-gray-800/80 text-center">
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-amber-400 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Host / Judge Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
