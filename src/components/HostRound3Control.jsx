import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Lock, Unlock, Zap, Flame, Trophy, 
  Sparkles, CheckCircle2, AlertTriangle, FileText, Search, Eye, Sliders, ShieldAlert 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const HostRound3Control = () => {
  const { socket, hostState } = useSocket();

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showBombConfirm, setShowBombConfirm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const round3State = hostState?.round3State || {};
  const teams = (hostState?.teams || []).filter(t => t.round2?.isQualified || t.isQualified);
  const phase = round3State.phase || 'master_draft';
  const isLocked = round3State.isLocked;

  // Controls
  const handleUnlock = () => socket?.emit('admin:unlock_round3');
  const handleLock = () => socket?.emit('admin:lock_round3');
  const handleStartTimer = () => socket?.emit('admin:start_round3_timer');
  const handlePauseTimer = () => socket?.emit('admin:pause_round3_timer');
  const handleResetTimer = () => socket?.emit('admin:reset_timer', { durationSeconds: 900 });

  // Detonate Bomb
  const handleDetonateBomb = () => {
    setShowBombConfirm(false);
    socket?.emit('admin:detonate_bomb');
  };

  // Evaluate All
  const handleEvaluateAll = () => {
    setIsEvaluating(true);
    socket?.emit('admin:evaluate_round3', {}, (res) => {
      setIsEvaluating(false);
      if (!res?.success) alert(res?.error || 'Evaluation failed.');
    });
  };

  // Reveal Podium
  const handleRevealPodium = () => {
    socket?.emit('admin:reveal_podium');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="cyber-card p-6 rounded-2xl border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#0d1424] to-red-950/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                ROUND 3 COMMAND CENTER • GRAND FINALE
              </span>
              <span className="text-xs font-mono text-gray-400">
                • Phase: {phase.toUpperCase()}
              </span>
            </div>
            <h2 className="font-display font-black text-3xl text-white tracking-wider mt-1">
              FINAL PROMPT BATTLE & CRISIS ADAPTATION
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isLocked ? (
              <button
                onClick={handleUnlock}
                className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
              >
                <Unlock className="w-4 h-4" />
                <span>UNLOCK ROUND 3</span>
              </button>
            ) : (
              <button
                onClick={handleLock}
                className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK ROUND 3</span>
              </button>
            )}

            {round3State.timerRunning ? (
              <button
                onClick={handlePauseTimer}
                className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-sm font-semibold flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="px-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-sm font-semibold flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Start Timer</span>
              </button>
            )}

            {/* Bomb Trigger Button */}
            <button
              onClick={() => setShowBombConfirm(true)}
              className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(255,0,0,0.6)] animate-pulse"
            >
              <Flame className="w-4 h-4" />
              <span>💣 DETONATE FINAL BOMB</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1f2b48]">
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-[#1f2b48]">
            <span className="text-[11px] font-mono uppercase text-gray-400">Finalist Teams</span>
            <div className="font-display font-bold text-2xl text-white mt-0.5">{teams.length} Teams</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase text-amber-400">Drafting Status</span>
            <div className="font-display font-bold text-2xl text-amber-300 mt-0.5">
              {teams.filter(t => t.round3?.status === 'drafting').length} Active
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-red-500/30">
            <span className="text-[11px] font-mono uppercase text-red-400">Bomb Adaptation</span>
            <div className="font-display font-bold text-2xl text-red-300 mt-0.5">
              {teams.filter(t => t.round3?.status === 'bomb_active').length} In Crisis
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Locked Submissions</span>
            <div className="font-display font-bold text-2xl text-emerald-400 mt-0.5">
              {teams.filter(t => t.round3?.status === 'submitted' || t.round3?.status === 'evaluated').length} Finalized
            </div>
          </div>
        </div>
      </div>

      {/* Batch Evaluation & Podium Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1f2b48] pb-4">
        <div className="text-xs font-mono text-gray-400">
          Grand Finale Adjudication & Live Podium Broadcast:
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleEvaluateAll}
            disabled={isEvaluating}
            className="cyber-btn flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.4)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? 'EVALUATING...' : 'BATCH EVALUATE ROUND 3 (50 PTS)'}</span>
          </button>

          <button
            onClick={handleRevealPodium}
            className="cyber-btn flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,215,0,0.5)] active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 REVEAL GRAND FINALE PODIUM</span>
          </button>
        </div>
      </div>

      {/* Finalist Teams Matrix */}
      <div className="overflow-x-auto rounded-xl border border-[#1f2b48] bg-[#0d1424]/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1f2b48] bg-[#070a13]/80 text-xs font-mono uppercase text-gray-400">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-3">Assigned Case</th>
              <th className="py-3 px-3 text-center">Master (/30)</th>
              <th className="py-3 px-3 text-center">Bomb (/20)</th>
              <th className="py-3 px-3 text-center">Total (/50)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b48]/60 text-sm font-sans">
            {teams.map((team, idx) => {
              const r3 = team.round3 || {};
              const masterScore = r3.evaluation?.master_subtotal ?? '-';
              const bombScore = r3.evaluation?.bomb_subtotal ?? '-';
              const totalScore = r3.evaluation?.total_score ?? '-';

              return (
                <tr key={team.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-400">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{team.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{team.id}</div>
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-cyan-300">
                    {r3.assignedCase?.title || "Tech Fest Crisis"}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-cyan-300">
                    {masterScore}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-red-400">
                    {bombScore}
                  </td>
                  <td className="py-3 px-3 text-center font-display font-black text-lg text-amber-400">
                    {totalScore}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      {r3.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="p-1.5 rounded-lg bg-[#070a13] border border-[#1f2b48] text-gray-400 hover:text-cyan-400"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detonate Bomb Confirmation Modal */}
      {showBombConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-md">
          <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.6)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center font-bold animate-pulse text-2xl">
                💣
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-white">CONFIRM BOMB DETONATION</h3>
                <p className="text-xs text-red-400 font-mono">Immediate 30-Second Emergency Window</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              This will detonate the disruptive bomb across all finalist screens simultaneously, trigger the Klaxon alarm, and lock the arena in exactly 30 seconds!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowBombConfirm(false)}
                className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-300 text-sm font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={handleDetonateBomb}
                className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,0,0.6)]"
              >
                DETONATE NOW!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
