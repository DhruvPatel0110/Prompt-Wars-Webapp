import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Lock, Unlock, Zap, Users, 
  Sparkles, Trophy, Download, CheckCircle2, AlertTriangle, 
  FileText, Search, RefreshCw, Eye, Sliders, ShieldCheck, Flame, Layers 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Leaderboard } from '../components/Leaderboard';
import { HostRound2Control } from '../components/HostRound2Control';
import { HostRound3Control } from '../components/HostRound3Control';
import { GrandFinalePodium } from '../components/GrandFinalePodium';

export const HostDashboard = () => {
  const { socket, hostState, evalProgress } = useSocket();

  const [activeMainTab, setActiveMainTab] = useState('round1'); // 'round1' | 'round2' | 'round3' | 'podium'
  const [activeR1SubTab, setActiveR1SubTab] = useState('radar'); // 'radar' | 'leaderboard'
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  const state = hostState?.roundState || {};
  const teams = hostState?.teams || [];
  const stats = hostState?.stats || {
    totalTeams: teams.length || 70,
    connectedCount: teams.filter(t => t.connected).length,
    r1Submitted: teams.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated').length,
    r2Submitted: teams.filter(t => t.round2?.status === 'both_submitted' || t.round2?.status === 'evaluated').length,
    r3Submitted: teams.filter(t => t.round3?.status === 'submitted' || t.round3?.status === 'evaluated').length
  };

  // Timer & Round Controls for Round 1
  const handleUnlockRound = () => socket?.emit('admin:unlock_round');
  const handleLockRound = () => socket?.emit('admin:lock_round');
  const handleStartTimer = () => socket?.emit('admin:start_timer');
  const handlePauseTimer = () => socket?.emit('admin:pause_timer');
  const handleResetTimer = () => socket?.emit('admin:reset_timer', { durationSeconds: 600 });
  const handleAddTime = (seconds = 60) => socket?.emit('admin:add_time', { seconds });

  // Evaluation Trigger for Round 1
  const handleEvaluateAll = () => {
    setIsEvaluating(true);
    socket?.emit('admin:evaluate_all', {}, (res) => {
      setIsEvaluating(false);
      if (!res?.success) alert(res?.error || 'Evaluation failed.');
    });
  };

  // Advance Round 1 to Round 2
  const handleAdvanceRound = () => {
    setShowAdvanceConfirm(false);
    socket?.emit('admin:advance_round');
    setActiveMainTab('round2');
  };

  const handleSwitchActiveRound = (r) => {
    socket?.emit('admin:set_active_round', { round: r });
    setActiveMainTab(r === 1 ? 'round1' : r === 2 ? 'round2' : 'round3');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Master Top Bar */}
      <div className="cyber-card p-6 rounded-2xl border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-[#0d1424] to-cyan-950/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                HOST COMMAND CENTER
              </span>
              <span className="text-xs font-mono text-gray-400">
                • Active Round: {hostState?.activeRound || 1}
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider mt-1">
              PROMPT WARS TOURNAMENT MASTER
            </h1>
          </div>

          {/* Quick Round Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#070a13] p-1.5 rounded-2xl border border-[#1f2b48]">
            <button
              onClick={() => setActiveMainTab('round1')}
              className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                activeMainTab === 'round1'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ROUND 1 : MAKEOVER
            </button>

            <button
              onClick={() => setActiveMainTab('round2')}
              className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                activeMainTab === 'round2'
                  ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ROUND 2 : REVERSE ENG
            </button>

            <button
              onClick={() => setActiveMainTab('round3')}
              className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                activeMainTab === 'round3'
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ROUND 3 : GRAND FINALE
            </button>

            {hostState?.podiumWinners && (
              <button
                onClick={() => setActiveMainTab('podium')}
                className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
                  activeMainTab === 'podium'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                🏆 PODIUM
              </button>
            )}
          </div>
        </div>

        {/* Global Live Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#1f2b48]">
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-[#1f2b48]">
            <span className="text-[11px] font-mono uppercase text-gray-400">Total Teams</span>
            <div className="font-display font-bold text-2xl text-white mt-0.5">{stats.totalTeams} Registered</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Connected</span>
            <div className="font-display font-bold text-2xl text-emerald-400 mt-0.5">{stats.connectedCount} Live</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-cyan-500/30">
            <span className="text-[11px] font-mono uppercase text-cyan-400">R1 Submissions</span>
            <div className="font-display font-bold text-2xl text-cyan-300 mt-0.5">{stats.r1Submitted} Locked</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-purple-500/30">
            <span className="text-[11px] font-mono uppercase text-purple-400">R2 Submissions</span>
            <div className="font-display font-bold text-2xl text-purple-300 mt-0.5">{stats.r2Submitted} Locked</div>
          </div>
          <div className="p-3 rounded-xl bg-[#070a13]/80 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase text-amber-400">R3 Finalists</span>
            <div className="font-display font-bold text-2xl text-amber-300 mt-0.5">{stats.r3Submitted} Completed</div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: ROUND 1 CONTROL CENTER                        */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'round1' && (
        <div className="space-y-6">
          {/* Sub-nav & Round 1 Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1f2b48] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveR1SubTab('radar')}
                className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                  activeR1SubTab === 'radar'
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-[#0d1424] text-gray-400 hover:text-white border border-[#1f2b48]'
                }`}
              >
                <Users className="w-4 h-4" />
                70-TEAM RADAR MATRIX
              </button>

              <button
                onClick={() => setActiveR1SubTab('leaderboard')}
                className={`px-4 py-2 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                  activeR1SubTab === 'leaderboard'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                    : 'bg-[#0d1424] text-gray-400 hover:text-white border border-[#1f2b48]'
                }`}
              >
                <Trophy className="w-4 h-4" />
                ROUND 1 LEADERBOARD
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {state.isLocked ? (
                <button
                  onClick={handleUnlockRound}
                  className="cyber-btn px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>UNLOCK R1</span>
                </button>
              ) : (
                <button
                  onClick={handleLockRound}
                  className="cyber-btn px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>LOCK R1</span>
                </button>
              )}

              {state.timerRunning ? (
                <button
                  onClick={handlePauseTimer}
                  className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start</span>
                </button>
              )}

              <button
                onClick={handleEvaluateAll}
                disabled={isEvaluating}
                className="cyber-btn px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEvaluating ? 'EVALUATING...' : 'BATCH EVALUATE'}</span>
              </button>

              <button
                onClick={() => setShowAdvanceConfirm(true)}
                className="cyber-btn px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,255,136,0.4)]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>ADVANCE TO R2</span>
              </button>
            </div>
          </div>

          {/* Radar View */}
          {activeR1SubTab === 'radar' && (
            <div className="space-y-4">
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
                        {t.evaluation && <span className="text-white font-bold">{t.evaluation.total_score}p</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard View */}
          {activeR1SubTab === 'leaderboard' && (
            <Leaderboard
              teams={teams}
              eliminationPercentage={50}
              onInspectTeam={(t) => setSelectedTeam(t)}
            />
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: ROUND 2 CONTROL CENTER                        */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'round2' && (
        <HostRound2Control />
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: ROUND 3 CONTROL CENTER                        */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'round3' && (
        <HostRound3Control />
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: GRAND FINALE PODIUM                           */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'podium' && (
        <GrandFinalePodium podiumWinners={hostState?.podiumWinners} />
      )}

      {/* Advance Round 1 Confirmation Modal */}
      {showAdvanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-emerald-500/50">
            <h3 className="font-display font-bold text-xl text-white mb-2">ADVANCE TO ROUND 2</h3>
            <p className="text-sm text-gray-300 mb-6">
              This will eliminate the bottom 50% of teams and broadcast Round 2 qualifications to all devices.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAdvanceConfirm(false)}
                className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-300 text-sm font-semibold"
              >
                CANCEL
              </button>
              <button
                onClick={handleAdvanceRound}
                className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-bold text-sm uppercase tracking-wider"
              >
                ADVANCE NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-[#1f2b48] pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-white">{selectedTeam.name}</h3>
                <p className="text-xs text-cyan-400 font-mono">{selectedTeam.id} • Status: {selectedTeam.submissionStatus}</p>
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
                  {selectedTeam.assignedQuestion?.badPrompt || "—"}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-emerald-400">Student Submitted Prompt:</span>
                <div className="mt-1 p-3.5 rounded-lg bg-[#070a13] border border-cyan-500/30 font-mono text-sm text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedTeam.submittedPrompt || selectedTeam.draftPrompt || "No text entered yet."}
                </div>
              </div>

              {selectedTeam.evaluation && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-sm text-cyan-300">Round 1 Evaluation</span>
                    <span className="font-display font-black text-2xl text-cyan-400">{selectedTeam.evaluation.total_score} / 20</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">"{selectedTeam.evaluation.reasoning}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
