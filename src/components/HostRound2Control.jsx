import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Lock, Unlock, Zap, Users, 
  Sparkles, Trophy, CheckCircle2, AlertTriangle, FileText, 
  Image as ImageIcon, Search, RefreshCw, Eye, Sliders, ShieldCheck,
  X, Check, Camera, Sun, Palette, Wand2
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const HostRound2Control = () => {
  const { socket, hostState, serverTimer } = useSocket();

  const [search, setSearch] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [evalProgress, setEvalProgress] = useState(null);

  const round2State = hostState?.round2State || {};
  const allTeams = hostState?.teams || [];
  const qualifiedFromR1 = allTeams.filter(t => t.isQualified);
  const teams = qualifiedFromR1.length > 0 ? qualifiedFromR1 : allTeams;

  const isR2Running = serverTimer?.round2?.timerRunning ?? round2State.timerRunning ?? false;
  const isLocked = serverTimer?.round2?.isLocked ?? round2State.isLocked ?? true;
  const r2TimerRemaining = serverTimer?.round2?.timerRemaining ?? round2State.timerRemaining ?? 900;

  const formatTime = (secs) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const submittedCount = teams.filter(t => t.round2?.submittedPrompt || t.round2?.c1_submittedPrompt).length;
  const evaluatedCount = teams.filter(t => t.round2?.evaluation || t.round2?.c1_evaluation).length;
  const highestScore = Math.max(0, ...teams.map(t => t.round2?.totalScore || 0));

  // Timer Controls
  const handleUnlock = () => socket?.emit('admin:unlock_round2');
  const handleLock = () => socket?.emit('admin:lock_round2');
  const handleStartTimer = () => socket?.emit('admin:start_round2_timer');
  const handlePauseTimer = () => socket?.emit('admin:pause_round2_timer');
  const handleResetTimer = (secs = 900) => socket?.emit('admin:reset_round2_timer', { durationSeconds: secs });

  // Evaluation Trigger
  const handleEvaluateAll = () => {
    setIsEvaluating(true);
    setEvalProgress({ completed: 0, total: teams.length });
    socket?.emit('admin:evaluate_round2', {}, (res) => {
      setIsEvaluating(false);
      setEvalProgress(null);
      if (!res?.success) alert(res?.error || 'Evaluation failed.');
    });
  };

  // Advance to Round 3
  const handleAdvance = () => {
    setShowAdvanceConfirm(false);
    socket?.emit('admin:advance_round2');
  };

  // Manual Score Adjustment
  const handleScoreChange = (teamId, criteriaKey, val) => {
    socket?.emit('admin:set_round2_score', {
      teamId,
      criteriaKey,
      score: Number(val)
    });
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
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                ROUND 2 COMMAND CENTER
              </span>
              <span className="text-xs font-mono text-gray-400">
                • Status: {round2State.status || 'LOCKED'}
              </span>
            </div>
            <h2 className="font-display font-black text-3xl text-white tracking-wider mt-1">
              PROMPT REVERSE ENGINEERING
            </h2>
            <p className="text-xs text-gray-400 font-sans mt-1">
              19 Unique competition images dynamically assigned across all participating teams.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-purple-500/40 flex items-center gap-2">
              <span className="font-mono font-black text-xl text-purple-300">
                {formatTime(r2TimerRemaining)}
              </span>
              {isR2Running ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">
                  ● RUNNING
                </span>
              ) : !isLocked ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  ⏸ PAUSED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-[10px] font-bold">
                  🔒 LOCKED
                </span>
              )}
            </div>

            {isLocked ? (
              <button
                onClick={handleUnlock}
                className="cyber-btn px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:brightness-110"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>UNLOCK R2</span>
              </button>
            ) : (
              <button
                onClick={handleLock}
                className="cyber-btn px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,51,102,0.4)] hover:brightness-110"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>LOCK R2</span>
              </button>
            )}

            {isR2Running ? (
              <button
                onClick={handlePauseTimer}
                className="px-3.5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,184,0,0.2)]"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start</span>
              </button>
            )}

            <button
              onClick={() => handleResetTimer(900)}
              className="px-3 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-400 hover:text-white text-xs font-mono flex items-center gap-1"
              title="Reset 15m Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>15m</span>
            </button>
          </div>
        </div>

        {/* Real-time Submissions Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1f2b48]">
          <div className="p-3.5 rounded-xl bg-[#070a13]/80 border border-[#1f2b48]">
            <span className="text-[11px] font-mono uppercase text-gray-400">Competing Teams</span>
            <div className="font-display font-bold text-2xl text-white mt-0.5">{teams.length} Teams</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070a13]/80 border border-cyan-500/30">
            <span className="text-[11px] font-mono uppercase text-cyan-400">Prompts Submitted</span>
            <div className="font-display font-bold text-2xl text-cyan-300 mt-0.5">{submittedCount} / {teams.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070a13]/80 border border-purple-500/30">
            <span className="text-[11px] font-mono uppercase text-purple-400">Evaluated</span>
            <div className="font-display font-bold text-2xl text-purple-300 mt-0.5">{evaluatedCount} / {teams.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070a13]/80 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Highest Score</span>
            <div className="font-display font-bold text-2xl text-emerald-400 mt-0.5">{highestScore} / 20</div>
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
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>EVALUATING AI PROMPTS...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>BATCH EVALUATE ROUND 2</span>
              </>
            )}
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
              <th className="py-3 px-4">Assigned Image</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-3 text-center">Score (/20)</th>
              <th className="py-3 px-3 text-center">Inspect & Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b48]/60 text-sm font-sans">
            {filteredTeams.map((team, idx) => {
              const r2 = team.round2 || {};
              const assigned = r2.assignedChallenge || {};
              const score = r2.totalScore ?? r2.evaluation?.total_score ?? '-';
              const isSub = !!(r2.submittedPrompt || r2.c1_submittedPrompt);
              const isEval = !!(r2.evaluation || r2.c1_evaluation);

              return (
                <tr key={team.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-400">
                    #{r2.rank || idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{team.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{team.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {assigned.imageUrl ? (
                        <img 
                          src={assigned.imageUrl} 
                          alt="Thumbnail" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/20 bg-black/60 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-gray-200 font-semibold truncate max-w-[180px]">
                          {assigned.title || `Image #${assigned.challengeNumber || idx + 1}`}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {assigned.id || `IMG_${String(idx + 1).padStart(2, '0')}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      isEval
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                        : isSub
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {isEval ? 'EVALUATED' : isSub ? 'SUBMITTED' : 'DRAFTING'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-display font-black text-lg text-emerald-400">
                      {score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="px-3 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspect & Manual Score Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border-cyan-500/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-5 bg-[#070a13]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-display font-bold text-xl text-white">
                  Inspect Submission: {selectedTeam.name}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  {selectedTeam.id} • Assigned Target: {selectedTeam.round2?.assignedChallenge?.title || 'Visual Asset'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTeam(null)}
                className="p-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.2] text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Image & Prompt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08]">
                <span className="font-mono text-xs uppercase text-cyan-400 font-bold block mb-2">
                  Assigned Target Image:
                </span>
                <div className="rounded-lg overflow-hidden border border-white/10 bg-black max-h-[260px] flex items-center justify-center">
                  <img
                    src={selectedTeam.round2?.assignedChallenge?.imageUrl || "/round2_images/1.png"}
                    alt="Target"
                    className="max-h-[250px] w-auto object-contain"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-300">
                  <div className="font-bold text-white">{selectedTeam.round2?.assignedChallenge?.title}</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{selectedTeam.round2?.assignedChallenge?.description}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs uppercase text-purple-400 font-bold block mb-2">
                    Student Re-Engineered Prompt:
                  </span>
                  <div className="p-3 rounded-lg bg-[#0d1424] border border-white/10 font-mono text-xs text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                    {selectedTeam.round2?.submittedPrompt || selectedTeam.round2?.draftPrompt || selectedTeam.round2?.c1_submittedPrompt || "No prompt submitted yet."}
                  </div>
                </div>

                <div className="mt-3 text-xs font-mono text-gray-400 flex items-center justify-between">
                  <span>Characters: {(selectedTeam.round2?.submittedPrompt || selectedTeam.round2?.draftPrompt || "").length}</span>
                  <span className="text-emerald-400">Total Score: {selectedTeam.round2?.totalScore || 0}/20</span>
                </div>
              </div>
            </div>

            {/* Rubric Score Breakdown & Manual Adjustments */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
              <span className="font-mono text-xs uppercase text-emerald-400 font-bold block mb-3">
                Rubric Breakdown & Host Score Adjustments (/5 each):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-400 block mb-1">Composition (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={selectedTeam.round2?.evaluation?.composition_score ?? 0}
                    onChange={(e) => handleScoreChange(selectedTeam.id, 'composition_score', e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-sm text-cyan-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-gray-400 block mb-1">Colors/Lighting (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={selectedTeam.round2?.evaluation?.colors_score ?? 0}
                    onChange={(e) => handleScoreChange(selectedTeam.id, 'colors_score', e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-sm text-amber-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-gray-400 block mb-1">Subject/Details (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={selectedTeam.round2?.evaluation?.subject_score ?? 0}
                    onChange={(e) => handleScoreChange(selectedTeam.id, 'subject_score', e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-sm text-purple-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-gray-400 block mb-1">Style/Medium (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={selectedTeam.round2?.evaluation?.style_score ?? 0}
                    onChange={(e) => handleScoreChange(selectedTeam.id, 'style_score', e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-sm text-emerald-300 font-mono font-bold"
                  />
                </div>
              </div>

              {selectedTeam.round2?.evaluation?.reasoning && (
                <div className="mt-3 text-xs text-gray-300 font-sans p-3 rounded-lg bg-black/60 border border-white/5">
                  <span className="font-bold text-gray-400 font-mono block mb-1">AI Reasoning:</span>
                  {selectedTeam.round2.evaluation.reasoning}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-display font-bold text-xs uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Confirmation Modal */}
      {showAdvanceConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border-emerald-500/40 max-w-md w-full text-center space-y-4 bg-[#070a13]">
            <div className="p-3.5 rounded-full bg-emerald-500/20 text-emerald-400 w-fit mx-auto border border-emerald-500/40">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              Advance to Round 3?
            </h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              This will lock Round 2, publish the final Round 2 leaderboard, qualify the top 50% performers with ≥8.0/20, and automatically allot case studies for the Grand Finale.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAdvanceConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvance}
                className="cyber-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,136,0.5)]"
              >
                Confirm Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
