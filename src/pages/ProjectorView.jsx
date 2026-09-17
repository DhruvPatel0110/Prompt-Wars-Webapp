import React from 'react';
import { Trophy, Zap, Users, CheckCircle2, Clock, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { TimerDisplay } from '../components/TimerDisplay';
import { GrandFinalePodium } from '../components/GrandFinalePodium';

export const ProjectorView = () => {
  const { serverTimer, projectorState } = useSocket();

  const activeRound = projectorState?.activeRound || 1;
  const r1State = projectorState?.roundState || serverTimer;
  const r2State = projectorState?.round2State || {};
  const r3State = projectorState?.round3State || {};
  const stats = projectorState?.stats || { totalTeams: 70, connectedCount: 0 };
  const r1Leaderboard = projectorState?.r1Leaderboard || [];
  const r2Leaderboard = projectorState?.r2Leaderboard || [];
  const r3Podium = projectorState?.r3Podium;

  // Podium Mode on Projector
  if (r3State.podiumRevealed && r3Podium) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white p-6 md:p-12 scanline">
        <GrandFinalePodium podiumWinners={r3Podium} />
      </div>
    );
  }

  // Active round state selector
  const currentRoundState = activeRound === 3 ? r3State : activeRound === 2 ? r2State : r1State;
  const roundTitle = activeRound === 3
    ? "ROUND 3 • FINAL PROMPT BATTLE & BOMB ADAPTATION"
    : activeRound === 2
    ? "ROUND 2 • PROMPT REVERSE ENGINEERING: 'SEE THE OUTPUT. BUILD THE PROMPT.'"
    : "ROUND 1 • PROMPT MAKEOVER: 'SPIN. UNLOCK. REWRITE.'";

  const isBombActive = activeRound === 3 && (r3State.phase === 'bomb_detonated' || r3State.bombRunning);

  return (
    <div className={`min-h-screen bg-[#070a13] text-white p-6 md:p-12 flex flex-col justify-between select-none scanline ${
      isBombActive ? 'border-8 border-red-600 animate-pulse' : ''
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1f2b48] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.5)]">
            <div className="w-full h-full bg-[#070a13] rounded-xl flex items-center justify-center">
              <Zap className="w-9 h-9 text-cyan-400 fill-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-4xl sm:text-5xl tracking-widest text-white">
                PROMPT<span className="text-cyan-400">WARS</span>
              </h1>
              <span className={`px-3 py-1 rounded text-sm font-mono border ${
                activeRound === 3
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : activeRound === 2
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                STAGE DISPLAY • ROUND {activeRound}
              </span>
            </div>
            <p className="text-gray-400 text-base font-sans tracking-wide mt-1">
              {roundTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-mono uppercase text-gray-400">STAGE RADAR</span>
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 text-lg">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              {stats.connectedCount} TEAMS CONNECTED
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Bomb Alert Overlay on Projector */}
      {isBombActive && (
        <div className="my-6 p-6 rounded-3xl bg-red-950/80 border-4 border-red-500 shadow-[0_0_60px_rgba(255,0,0,0.7)] text-center animate-bounce">
          <div className="flex items-center justify-center gap-3 text-red-400 mb-2">
            <Flame className="w-8 h-8 animate-spin" />
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider">
              🚨 SUDDEN INTELLIGENCE INJECTED: 30-SECOND CRISIS ADAPTATION!
            </h2>
          </div>
          <div className="font-mono font-black text-6xl text-red-400 mt-2">
            00:{String(r3State.bombTimerRemaining ?? 30).padStart(2, '0')}s
          </div>
        </div>
      )}

      {/* Center Arena Section: Giant Stage Clock */}
      {!isBombActive && (
        <div className="my-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            {currentRoundState.isLocked ? "🔒 ARENA LOCKED" : "⚡ ARENA ACTIVE — HIGH TRAFFIC STREAM"}
          </div>

          <div className="my-4">
            <TimerDisplay
              timerRemaining={currentRoundState.timerRemaining}
              timerRunning={currentRoundState.timerRunning}
              timerEndsAt={currentRoundState.timerEndsAt}
              size="giant"
            />
          </div>
        </div>
      )}

      {/* Bottom Stage Leaderboard Highlights */}
      {activeRound === 1 && r1Leaderboard.length > 0 && (
        <div className="cyber-card p-6 rounded-2xl border-amber-500/40 mt-4">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2b48] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              <h3 className="font-display font-bold text-2xl text-white">
                ROUND 1 TOP QUALIFYING TEAMS
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">TOP 50% ADVANCING</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {r1Leaderboard.slice(0, 5).map((t, idx) => (
              <div key={t.teamId} className="p-3.5 rounded-xl bg-[#070a13] border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm truncate max-w-[120px]">{t.teamName}</div>
                  <div className="text-[10px] font-mono text-gray-500">{t.teamId}</div>
                </div>
                <div className="font-display font-bold text-lg text-cyan-400">{t.score}p</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRound === 2 && r2Leaderboard.length > 0 && (
        <div className="cyber-card p-6 rounded-2xl border-purple-500/40 mt-4">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2b48] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-purple-400 animate-bounce" />
              <h3 className="font-display font-bold text-2xl text-white">
                ROUND 2 REVERSE ENGINEERING STANDINGS
              </h3>
            </div>
            <span className="text-xs font-mono text-purple-400">TOP 50% ADVANCING TO GRAND FINALE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {r2Leaderboard.slice(0, 5).map((t, idx) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-[#070a13] border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm truncate max-w-[120px]">{t.name}</div>
                  <div className="text-[10px] font-mono text-gray-500">{t.id}</div>
                </div>
                <div className="font-display font-bold text-lg text-purple-300">{t.round2?.totalScore}p</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1f2b48]/80 text-xs font-mono text-gray-500">
        <span>PROMPT WARS 2026 • AI PROMPT ENGINEERING CHAMPIONSHIP</span>
        <span>AUTHORITATIVE STAGE SYNC ENGINE</span>
      </div>
    </div>
  );
};
