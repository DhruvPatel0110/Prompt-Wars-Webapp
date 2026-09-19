import React, { useState } from 'react';
import { Zap, ChevronRight, AlertCircle, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const LoginPage = () => {
  const { loginTeam, authError, isAuthenticating } = useAuth();
  const { isConnected, latency } = useSocket();

  const [teamName, setTeamName] = useState('');

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const cleanName = teamName.trim();

    if (!cleanName) {
      alert('Please enter your Team Name.');
      return;
    }

    await loginTeam({
      teamName: cleanName
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
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
        <div className="cyber-card rounded-2xl p-6 sm:p-8 border-cyan-500/40 bg-gradient-to-b from-[#0d1424]/95 via-[#070a13]/90 to-[#070a13] shadow-[0_0_40px_rgba(0,240,255,0.12)]">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#1f2b48]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-sm tracking-wider text-white uppercase">
              Team Registration
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
                  placeholder="e.g. Prompt Wizards, Neural Ninjas, CyberSquad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#070a13] border border-[#1f2b48] text-white font-sans text-base focus:outline-none focus:border-cyan-400 shadow-inner transition-colors"
                />
                <Users className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 font-sans pt-1">
              Entering your team name connects you live to the tournament arena and places you in the waiting lobby.
            </p>

            <button
              type="submit"
              disabled={isAuthenticating || !isConnected}
              className="cyber-btn w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'JOINING ARENA...' : 'JOIN ARENA LOBBY'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
