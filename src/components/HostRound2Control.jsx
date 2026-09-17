import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Lock, Unlock, Zap, Users, 
  Sparkles, Trophy, CheckCircle2, AlertTriangle, FileText, 
  Image as ImageIcon, Search, RefreshCw, Eye, Sliders, ShieldCheck 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const HostRound2Control = () => {
  const { socket, hostState } = useSocket();

  const [search, setSearch] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  const round2State = hostState?.round2State || {};
  const teams = (hostState?.teams || []).filter(t => t.isQualified);
  const isLocked = round2State.isLocked;

  const bothCount = teams.filter(t => t.round2?.c1_submittedPrompt && t.round2?.c2_submittedPrompt).length;
  const c1Count = teams.filter(t => t.round2?.c1_submittedPrompt).length;
  const c2Count = teams.filter(t => t.round2?.c2_submittedPrompt).length;

  // Timer Controls
  const handleUnlock = () => socket?.emit('admin:unlock_round2');
  const handleLock = () => socket?.emit('admin:lock_round2');
  const handleStartTimer = () => socket?.emit('admin:start_round2_timer');
  const handlePauseTimer = () => socket?.emit('admin:pause_round2_timer');
  const handleResetTimer = () => socket?.emit('admin:reset_round2_timer', { durationSeconds: 900 });

  // Evaluation Trigger
  const handleEvaluateAll = () => {
    setIsEvaluating(true);
    socket?.emit('admin:evaluate_round2', {}, (res) => {
      setIsEvaluating(false);
      if (!res?.success) alert(res?.error || 'Evaluation failed.');
    });
  };

  // Advance to Round 3
  const handleAdvance = () => {
    setShowAdvanceConfirm(false);
    socket?.emit('admin:advance_round2');
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Banner */}
      <div className="cyber-card p-6 rounded-2xl border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-[#0d1424] to-cyan-950/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                ROUND 2 COMMAND CENTER
              </span>
              <span className="text-xs font-mono text-gray-400">
                • Status: {round2State.status || 'LOCKED'}
              </span>
            </div>
            <h2 className="font-display font-black text-3xl text-white tracking-wider mt-1">
              PROMPT REVERSE ENGINEERING
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
                <span>UNLOCK ROUND 2</span>
              </button>
            ) : (
              <button
                onClick={handleLock}
                className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,51,102,0.4)]"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK ROUND 2</span>
              </button>
            )}

            {round2State.timerRunning ? (
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

            <button
              onClick={handleResetTimer}
              className="px-3.5 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-400 hover:text-white text-xs font-mono"
              title="Reset 15m Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time Submissions Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1f2b48]">
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-[#1f2b48]">
            <span className="text-[11px] font-mono uppercase text-gray-400">Qualified in R2</span>
            <div className="font-display font-bold text-2xl text-white mt-0.5">{teams.length} Teams</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-cyan-500/30">
            <span className="text-[11px] font-mono uppercase text-cyan-400">C1 Image Prompts</span>
            <div className="font-display font-bold text-2xl text-cyan-300 mt-0.5">{c1Count} Locked</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-purple-500/30">
            <span className="text-[11px] font-mono uppercase text-purple-400">C2 Report Prompts</span>
            <div className="font-display font-bold text-2xl text-purple-300 mt-0.5">{c2Count} Locked</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Both Completed</span>
            <div className="font-display font-bold text-2xl text-emerald-400 mt-0.5">{bothCount} Teams</div>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1f2b48] pb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0d1424] border border-[#1f2b48] text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleEvaluateAll}
            disabled={isEvaluating}
            className="cyber-btn flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.4)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? 'EVALUATING...' : 'BATCH EVALUATE ROUND 2'}</span>
          </button>

          <button
            onClick={() => setShowAdvanceConfirm(true)}
            className="cyber-btn flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,136,0.4)]"
          >
            <Zap className="w-4 h-4" />
            <span>ADVANCE TO ROUND 3</span>
          </button>
        </div>
      </div>

      {/* Round 2 Submissions Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1f2b48] bg-[#0d1424]/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1f2b48] bg-[#070a13]/80 text-xs font-mono uppercase text-gray-400">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-3 text-center">C1 Image (/20)</th>
              <th className="py-3 px-3 text-center">C2 Report (/20)</th>
              <th className="py-3 px-3 text-center">Total (/40)</th>
              <th className="py-3 px-4 text-center">R2 Status</th>
              <th className="py-3 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b48]/60 text-sm font-sans">
            {filteredTeams.map((team, idx) => {
              const r2 = team.round2 || {};
              const c1Score = r2.c1_evaluation?.total_score ?? '-';
              const c2Score = r2.c2_evaluation?.total_score ?? '-';
              const total = r2.totalScore || 0;

              return (
                <tr key={team.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-400">
                    #{r2.rank || idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{team.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{team.id}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold">
                      {c1Score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold">
                      {c2Score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-display font-extrabold text-lg text-emerald-400">
                    {total}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      r2.status === 'both_submitted' || r2.status === 'evaluated'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : r2.status === 'c1_submitted' || r2.status === 'c2_submitted'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {r2.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="p-1.5 rounded-lg bg-[#070a13] border border-[#1f2b48] hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400"
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

      {/* Advance Modal */}
      {showAdvanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-emerald-500/50">
            <h3 className="font-display font-bold text-xl text-white mb-2">ADVANCE TO ROUND 3</h3>
            <p className="text-sm text-gray-300 mb-6">
              This will eliminate the bottom 50% of Round 2 teams and advance the top finalists to Round 3: Final Prompt Battle!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAdvanceConfirm(false)}
                className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-300 text-sm font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={handleAdvance}
                className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-bold text-sm uppercase tracking-wider"
              >
                CONFIRM & ADVANCE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
