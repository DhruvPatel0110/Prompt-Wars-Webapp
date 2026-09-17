import React, { useState } from 'react';
import { Zap, Lock, ChevronRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const LoginPage = ({ onSwitchToAdmin }) => {
  const { loginTeam, authError, isAuthenticating } = useAuth();
  const { isConnected, latency } = useSocket();

  const [selectedTeamId, setSelectedTeamId] = useState('team_01');
  const [teamPin, setTeamPin] = useState('1001');

  // Auto-fill PIN helper when changing team dropdown
  const handleTeamChange = (e) => {
    const val = e.target.value;
    setSelectedTeamId(val);
    const num = parseInt(val.replace('team_', ''), 10);
    if (!isNaN(num)) {
      setTeamPin(String(1000 + num));
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    await loginTeam(selectedTeamId, teamPin);
  };

  // Generate 70 team options
  const teamOptions = Array.from({ length: 70 }, (_, i) => {
    const id = `team_${String(i + 1).padStart(2, '0')}`;
    return { id, label: `Team ${String(i + 1).padStart(2, '0')}` };
  });

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

        {/* Team Auth Card */}
        <div className="cyber-card rounded-2xl p-6 sm:p-8">
          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleTeamSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Select Your Team:
              </label>
              <select
                value={selectedTeamId}
                onChange={handleTeamChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-mono focus:outline-none focus:border-cyan-500/50"
              >
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#070a13]">
                    {t.label} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Team Access PIN:
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={teamPin}
                  onChange={(e) => setTeamPin(e.target.value)}
                  required
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-mono tracking-widest focus:outline-none focus:border-cyan-500/50"
                />
                <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-mono">
                Default PIN for {selectedTeamId}: <span className="text-cyan-400 font-bold">{1000 + parseInt(selectedTeamId.replace('team_', ''), 10)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !isConnected}
              className="cyber-btn w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'AUTHENTICATING...' : 'ENTER TOURNAMENT ARENA'}</span>
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
