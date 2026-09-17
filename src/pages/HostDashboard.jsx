import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Lock, Unlock, Zap, Users, 
  Sparkles, Trophy, Download, CheckCircle2, AlertTriangle, 
  FileText, Search, RefreshCw, Eye, Sliders, ShieldCheck, Flame
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Leaderboard } from '../components/Leaderboard';

export const HostDashboard = () => {
  const { socket, isConnected, serverTimer, hostState, evalProgress } = useSocket();

  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'submissions' | 'leaderboard' | 'settings'
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(10);
  const [eliminationCutoff, setEliminationCutoff] = useState(50);
  const [manualEditScore, setManualEditScore] = useState(null);

  const state = hostState?.roundState || serverTimer;
  const teams = hostState?.teams || [];
  const stats = hostState?.stats || {
    totalTeams: teams.length || 50,
    connectedCount: teams.filter(t => t.connected).length,
    draftingCount: teams.filter(t => t.submissionStatus === 'drafting').length,
    submittedCount: teams.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated').length
  };

  // Timer & Round Controls
  const handleUnlockRound = () => socket?.emit('admin:unlock_round');
  const handleLockRound = () => socket?.emit('admin:lock_round');
  const handleStartTimer = () => socket?.emit('admin:start_timer');
  const handlePauseTimer = () => socket?.emit('admin:pause_timer');
  const handleResetTimer = () => socket?.emit('admin:reset_timer', { durationSeconds: customMinutes * 60 });
  const handleAddTime = (seconds = 60) => socket?.emit('admin:add_time', { seconds });

  // Evaluation Trigger
  const handleEvaluateAll = () => {
    setIsEvaluating(true);
    socket?.emit('admin:evaluate_all', {}, (res) => {
      setIsEvaluating(false);
      if (!res?.success) {
        alert(res?.error || 'Evaluation failed.');
      }
    });
  };

  // Advance Round
  const handleAdvanceRound = () => {
    setShowAdvanceConfirm(false);
    socket?.emit('admin:advance_round');
  };

  // Reset Event
  const handleResetEvent = () => {
    if (confirm("Are you sure you want to reset all Round 1 data and team scores?")) {
      socket?.emit('admin:reset_event');
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    t.id.toLowerCase().includes(teamSearch.toLowerCase()) ||
    (t.assignedGenre?.name && t.assignedGenre.name.toLowerCase().includes(teamSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Master Command Bar */}
      <div className="cyber-card p-6 rounded-2xl border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-[#0d1424] to-cyan-950/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Title & Status */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                HOST COMMAND CENTER
              </span>
              <span className="text-xs font-mono text-gray-400">
                • Round 1: {state.status || 'ACTIVE'}
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider mt-1">
              PROMPT WARS MASTER CONTROL
            </h1>
          </div>

          {/* Master Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {state.isLocked ? (
              <button
                onClick={handleUnlockRound}
                className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
              >
                <Unlock className="w-4 h-4" />
                <span>UNLOCK ROUND 1</span>
              </button>
            ) : (
              <button
                onClick={handleLockRound}
                className="cyber-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,51,102,0.4)]"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK ROUND 1</span>
              </button>
            )}

            {state.timerRunning ? (
              <button
                onClick={handlePauseTimer}
                className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="px-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume Timer</span>
              </button>
            )}

            <button
              onClick={() => handleAddTime(60)}
              className="px-3.5 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] hover:border-cyan-500/50 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1 transition-colors"
              title="Add +1 minute to timer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+1m</span>
            </button>

            <button
              onClick={handleResetTimer}
              className="px-3.5 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] hover:border-gray-600 text-gray-400 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <a
              href="/api/export/csv"
              download
              className="px-4 py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] hover:border-emerald-500/50 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </a>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1f2b48]/80">
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-[#1f2b48]">
            <span className="text-[11px] font-mono uppercase text-gray-400">Total Registered</span>
            <div className="font-display font-bold text-2xl text-white mt-0.5">{stats.totalTeams} Teams</div>
          </div>

          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Live Connected</span>
            <div className="font-display font-bold text-2xl text-emerald-400 mt-0.5">{stats.connectedCount} Devices</div>
          </div>

          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase text-amber-400">Drafting Prompts</span>
            <div className="font-display font-bold text-2xl text-amber-300 mt-0.5">{stats.draftingCount} Teams</div>
          </div>

          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-cyan-500/30">
            <span className="text-[11px] font-mono uppercase text-cyan-400">Submissions In</span>
            <div className="font-display font-bold text-2xl text-cyan-300 mt-0.5">{stats.submittedCount} Locked</div>
          </div>
        </div>
      </div>

      {/* AI Evaluation Progress Banner */}
      {evalProgress && (
        <div className="cyber-card p-4 rounded-xl border-cyan-500/50 bg-cyan-950/30 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              AI Evaluator Grading Submissions: {evalProgress.completed} / {evalProgress.total}
            </span>
            <span>{Math.round((evalProgress.completed / evalProgress.total) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-[#070a13] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${(evalProgress.completed / evalProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1f2b48] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#0d1424] text-gray-400 hover:text-white border border-[#1f2b48]'
            }`}
          >
            <Users className="w-4 h-4" />
            50-TEAM RADAR MATRIX
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-[#0d1424] text-gray-400 hover:text-white border border-[#1f2b48]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            LEADERBOARD & ELIMINATION
          </button>
        </div>

        {/* Batch Actions: Evaluate & Advance */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluateAll}
            disabled={isEvaluating}
            className="cyber-btn px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.4)] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? 'EVALUATING...' : 'BATCH EVALUATE ALL'}</span>
          </button>

          <button
            onClick={() => setShowAdvanceConfirm(true)}
            className="cyber-btn px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(0,255,136,0.5)] active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>ADVANCE & BROADCAST VERDICTS</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: 50-TEAM RADAR MATRIX GRID                     */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-gray-400">
              Live status radar for all 50 concurrent client systems:
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Online</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Submitted</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Drafting</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-600" /> Offline</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {teams.map((t) => {
              const isSub = t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated';
              const isDraft = t.submissionStatus === 'drafting';
              const isConn = t.connected;

              let borderCol = "border-[#1f2b48]";
              let bgCol = "bg-[#0d1424]/60";
              let badge = "OFFLINE";
              let badgeColor = "text-gray-500";

              if (isSub) {
                borderCol = "border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.15)]";
                bgCol = "bg-cyan-950/20";
                badge = "SUBMITTED";
                badgeColor = "text-cyan-400";
              } else if (isDraft) {
                borderCol = "border-amber-500/40";
                bgCol = "bg-amber-950/20";
                badge = "DRAFTING";
                badgeColor = "text-amber-400";
              } else if (isConn) {
                borderCol = "border-emerald-500/40";
                bgCol = "bg-emerald-950/20";
                badge = "ONLINE";
                badgeColor = "text-emerald-400";
              }

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeam(t)}
                  className={`p-2.5 rounded-xl border ${borderCol} ${bgCol} cursor-pointer hover:scale-[1.03] transition-all flex flex-col justify-between h-24 select-none`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white">
                      {t.id.replace('team_', '#')}
                    </span>
                    {t.spinResult ? (
                      <span
                        className="text-[10px] font-bold px-1.5 rounded"
                        style={{ backgroundColor: `${t.assignedGenre?.color || '#00f0ff'}33`, color: t.assignedGenre?.color || '#00f0ff' }}
                      >
                        {t.spinResult}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    )}
                  </div>

                  <div className="text-[11px] font-medium text-gray-300 truncate" title={t.name}>
                    {t.name.split('-')[1] || t.name}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#1f2b48]/60">
                    <span className={`font-semibold ${badgeColor}`}>{badge}</span>
                    {t.evaluation && (
                      <span className="text-white font-bold">{t.evaluation.total_score}p</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: LEADERBOARD & ELIMINATION CONTROLLER          */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'leaderboard' && (
        <Leaderboard
          teams={teams}
          eliminationPercentage={eliminationCutoff}
          onInspectTeam={(team) => setSelectedTeam(team)}
        />
      )}

      {/* Team Inspection / Manual Scoring Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-[#1f2b48] pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-white">
                  {selectedTeam.name}
                </h3>
                <p className="text-xs text-cyan-400 font-mono">
                  {selectedTeam.id} • Status: {selectedTeam.submissionStatus}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-white text-xl font-bold px-3 py-1 rounded-lg bg-[#070a13] border border-[#1f2b48]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase text-red-400">Assigned Bad Prompt:</span>
                <div className="mt-1 p-3 rounded-lg bg-red-950/20 border border-red-500/30 font-mono text-sm text-red-200">
                  {selectedTeam.assignedQuestion?.badPrompt || "Not spun yet."}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-emerald-400">Student Submitted Prompt:</span>
                <div className="mt-1 p-3.5 rounded-lg bg-[#070a13] border border-cyan-500/30 font-mono text-sm text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedTeam.submittedPrompt || selectedTeam.draftPrompt || "No text entered yet."}
                </div>
              </div>

              {/* Manual Scoring Controls */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <h4 className="font-display font-bold text-sm text-cyan-300 mb-3 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  Score Adjustments (20 Points Rubric):
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-gray-400">Clarity (0-5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      defaultValue={selectedTeam.evaluation?.clarity_score || 0}
                      onChange={(e) => socket?.emit('admin:set_manual_score', { teamId: selectedTeam.id, criteriaKey: 'clarity_score', score: e.target.value })}
                      className="w-full mt-1 p-1.5 rounded bg-[#070a13] border border-[#1f2b48] text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400">Context (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      defaultValue={selectedTeam.evaluation?.context_score || 0}
                      onChange={(e) => socket?.emit('admin:set_manual_score', { teamId: selectedTeam.id, criteriaKey: 'context_score', score: e.target.value })}
                      className="w-full mt-1 p-1.5 rounded bg-[#070a13] border border-[#1f2b48] text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400">Constraints (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      defaultValue={selectedTeam.evaluation?.constraints_score || 0}
                      onChange={(e) => socket?.emit('admin:set_manual_score', { teamId: selectedTeam.id, criteriaKey: 'constraints_score', score: e.target.value })}
                      className="w-full mt-1 p-1.5 rounded bg-[#070a13] border border-[#1f2b48] text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400">Format (0-3)</label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      defaultValue={selectedTeam.evaluation?.format_score || 0}
                      onChange={(e) => socket?.emit('admin:set_manual_score', { teamId: selectedTeam.id, criteriaKey: 'format_score', score: e.target.value })}
                      className="w-full mt-1 p-1.5 rounded bg-[#070a13] border border-[#1f2b48] text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400">Creativity (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      defaultValue={selectedTeam.evaluation?.creativity_score || 0}
                      onChange={(e) => socket?.emit('admin:set_manual_score', { teamId: selectedTeam.id, criteriaKey: 'creativity_score', score: e.target.value })}
                      className="w-full mt-1 p-1.5 rounded bg-[#070a13] border border-[#1f2b48] text-white text-center font-bold"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f2b48] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">Calculated Total Score:</span>
                  <span className="font-display font-black text-2xl text-cyan-400">
                    {selectedTeam.evaluation?.total_score || 0} / 20
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Round Confirmation Modal */}
      {showAdvanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">CONFIRM ROUND ADVANCEMENT</h3>
                <p className="text-xs text-emerald-400 font-mono">Broadcast Verdicts to All 50 Devices</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              This action will calculate the final leaderboard, eliminate the bottom 50% of teams, and immediately push pass/fail results to all connected student screens simultaneously.
            </p>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 mb-6">
              ✓ Top 50% will see Round 2 Qualification screens.<br />
              ✓ Bottom 50% will see Elimination screens.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanceConfirm(false)}
                className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-300 text-sm font-semibold"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleAdvanceRound}
                className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-bold text-sm uppercase tracking-wider"
              >
                BROADCAST NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
