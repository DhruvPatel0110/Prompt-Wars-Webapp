import React, { useState } from 'react';
import { Zap, ShieldCheck, Users, Projector, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const LoginPage = () => {
  const { loginTeam, loginAdmin, loginProjector, authError, isAuthenticating } = useAuth();
  const { isConnected, latency } = useSocket();

  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'admin' | 'projector'
  const [selectedTeamId, setSelectedTeamId] = useState('team_01');
  const [teamPin, setTeamPin] = useState('1001');
  const [adminPin, setAdminPin] = useState('');

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

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    await loginAdmin(adminPin);
  };

  // Generate 50 team options
  const teamOptions = Array.from({ length: 50 }, (_, i) => {
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
            AI Prompt Engineering Championship • 50-Team Arena
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1424] border border-[#1f2b48] text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? `SERVER ONLINE (${latency}ms)` : 'CONNECTING TO SERVER...'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0d1424] border border-[#1f2b48] mb-6">
          <button
            onClick={() => setActiveTab('team')}
            className={`py-2 px-3 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'team'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            TEAM
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 px-3 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            HOST
          </button>

          <button
            onClick={() => setActiveTab('projector')}
            className={`py-2 px-3 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'projector'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Projector className="w-4 h-4" />
            STAGE
          </button>
        </div>

        {/* Auth Card */}
        <div className="cyber-card rounded-2xl p-6 sm:p-8">
          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* 1. Team Login Form */}
          {activeTab === 'team' && (
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
                  Default PIN for {selectedTeamId}: <span className="text-cyan-400">{1000 + parseInt(selectedTeamId.replace('team_', ''), 10)}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !isConnected}
                className="cyber-btn w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50"
              >
                <span>{isAuthenticating ? 'AUTHENTICATING...' : 'ENTER ROUND 1 ARENA'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* 2. Admin Host Login Form */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 mb-1.5">
                  Host Secret Key / PIN:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter Host PIN (e.g. admin123)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    required
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#070a13] border border-amber-500/30 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  Default: <span className="text-amber-400">admin123</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !isConnected}
                className="cyber-btn w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,0,0.4)] disabled:opacity-50"
              >
                <span>{isAuthenticating ? 'VERIFYING...' : 'ACCESS HOST CONTROL ROOM'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* 3. Stage Projector Mode */}
          {activeTab === 'projector' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-300">
                Launch the grand stage projector view for the main event screen. Displays synchronized tournament timer, live statistics, and dramatic leaderboard reveals.
              </p>

              <button
                onClick={loginProjector}
                className="cyber-btn w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(138,43,226,0.4)]"
              >
                <Projector className="w-5 h-5" />
                <span>LAUNCH STAGE PROJECTOR</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
