import React from 'react';
import { Trophy, Zap, Users, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { TimerDisplay } from '../components/TimerDisplay';

export const ProjectorView = () => {
  const { serverTimer, projectorState } = useSocket();

  const state = projectorState?.roundState || serverTimer;
  const stats = projectorState?.stats || { totalTeams: 50, connectedCount: 0, submittedCount: 0 };
  const leaderboard = projectorState?.leaderboard || [];

  return (
    <div className="min-h-screen bg-[#070a13] text-white p-6 md:p-12 flex flex-col justify-between select-none scanline">
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
              <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-sm border border-cyan-500/30">
                STAGE DISPLAY
              </span>
            </div>
            <p className="text-gray-400 text-base font-sans tracking-wide">
              ROUND 1 • PROMPT MAKEOVER: "SPIN. UNLOCK. REWRITE."
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

      {/* Center Arena Section: Giant Stage Clock & Live Progress */}
      <div className="my-10 flex flex-col items-center justify-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(0,240,255,0.2)]">
          {state.isLocked ? "🔒 STAGE LOCKED — PREPARE TO SPIN" : "⚡ ARENA ACTIVE — REWRITE UNDERWAY"}
        </div>

        {/* Giant Master Clock */}
        <div className="my-4">
          <TimerDisplay
            timerRemaining={state.timerRemaining}
            timerRunning={state.timerRunning}
            timerEndsAt={state.timerEndsAt}
            size="giant"
          />
        </div>

        {/* Live Submissions Tracker Bar */}
        <div className="w-full max-w-3xl mt-8 p-6 rounded-2xl cyber-card border-cyan-500/30 bg-[#0d1424]/90">
          <div className="flex items-center justify-between text-base font-mono mb-3">
            <span className="text-gray-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              Live Submissions Received:
            </span>
            <span className="font-bold text-cyan-400 text-xl font-display">
              {stats.submittedCount} / {stats.totalTeams} TEAMS ({Math.round((stats.submittedCount / stats.totalTeams) * 100)}%)
            </span>
          </div>

          <div className="w-full h-4 bg-[#070a13] rounded-full overflow-hidden p-0.5 border border-[#1f2b48]">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(0,240,255,0.6)]"
              style={{ width: `${(stats.submittedCount / stats.totalTeams) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Stage Leaderboard Highlights */}
      {leaderboard.length > 0 && (
        <div className="cyber-card p-6 rounded-2xl border-amber-500/40 mt-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2b48] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              <h3 className="font-display font-bold text-2xl text-white">
                ROUND 1 TOP ADVANCING TEAMS
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              TOP 50% QUALIFIED FOR ROUND 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {leaderboard.slice(0, 5).map((t, idx) => (
              <div
                key={t.teamId}
                className="p-3.5 rounded-xl bg-[#070a13] border border-amber-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(255,184,0,0.15)]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-display font-black text-xl text-amber-400">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white text-sm truncate max-w-[120px]">
                      {t.teamName}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">{t.teamId}</div>
                  </div>
                </div>
                <div className="font-display font-bold text-lg text-cyan-400">
                  {t.score}p
                </div>
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
