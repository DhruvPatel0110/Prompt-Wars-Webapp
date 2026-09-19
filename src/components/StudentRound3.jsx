import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame, Zap, AlertTriangle, Clock, Send, Sparkles, Trophy,
  CheckCircle2, FileText, Check, Copy, ArrowRight, ShieldAlert,
  Sliders, Award, RefreshCw, Layers, CheckSquare, Square,
  HelpCircle, Compass, Target, Activity, Wand2, FlaskConical
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { PromptSandboxModal } from './PromptSandboxModal';
import { soundEngine } from '../utils/audio';

export const StudentRound3 = ({ team, round3State }) => {
  const { socket, serverTimer } = useSocket();

  const [masterDraft, setMasterDraft] = useState(team?.round3?.masterDraft || '');
  const [adaptedDraft, setAdaptedDraft] = useState(team?.round3?.adaptedDraft || '');
  const [checkedPillars, setCheckedPillars] = useState(new Set());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetonationModal, setShowDetonationModal] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const sandboxRunsLeft = team?.sandbox?.r3RunsLeft ?? 4;

  const handleRunSandbox = ({ round, challengeType, promptText, testInput }) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket disconnected"));
      const isBomb = round3State?.phase === 'bomb_detonated' || team?.round3?.status === 'bomb_active';
      const promptToTest = isBomb ? (adaptedDraft || masterDraft) : masterDraft;
      socket.emit('team:sandbox_run', {
        teamId: team.id,
        round: 3,
        challengeType: isBomb ? 'bomb' : 'master',
        promptText: promptToTest,
        testInput
      }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Sandbox execution failed."));
      });
    });
  };

  const masterAutosaveRef = useRef(null);
  const adaptedAutosaveRef = useRef(null);

  const r3 = team?.round3 || {};
  const caseItem = r3.assignedCase || {
    title: "National Tech Fest Participation & Growth Crisis",
    category: "Growth & Event Operations",
    scenario: {
      context: "A premier engineering university is organizing its annual flagship 3-day tech symposium in 30 days.",
      metrics: {
        expectedAuditoriumCapacity: "1,000 Students",
        previousYearAttendance: "350 Students",
        targetAttendanceGoal: "800+ Registered Attendees",
        marketingBudget: "₹15,000 Total",
        promotionPeriodDays: "30 Days",
        activeStudentVolunteers: "20 Members"
      },
      requiredPillars: [
        "1. Target Audience Segmentation & High-Conversion Student Personas",
        "2. Zero-Cost & Low-Cost Guerrilla Marketing Strategy",
        "3. High-Conversion Content, Reel & Discord Viral Campaign Plan",
        "4. Campus Ambassador Network & Referral Incentive Mechanics",
        "5. Granular INR Budget Allocation Matrix with Contingency Buffer",
        "6. 30-Day Day-by-Day Milestone Gantt Roadmap (Tease -> Blitz -> Conversion -> Last-mile)",
        "7. Gamified Student Engagement Funnel & Exclusive Ticket Unlock Perks",
        "8. Measurable Conversion Funnel KPIs & Stage Benchmarks",
        "9. High-Stakes Risk Mitigation & Crisis Management Matrix",
        "10. Projected ROI, Revenue Model & Attendance Conversion Projections"
      ]
    }
  };

  const bombItem = r3.assignedBomb || {
    headline: "🚨 CRITICAL BUDGET SLASH: ₹15,000 ➔ ₹3,000!",
    description: "Marketing budget slashed to ₹3,000. All paid ads and print banners are immediately revoked.",
    directive: "Pivot immediately to zero-cost growth hacking, viral WhatsApp squad tickets, and peer-to-peer Discord bounties."
  };

  const phase = round3State?.phase || 'master_draft';
  const isBombPhase = phase === 'bomb_detonated' || r3.status === 'bomb_active';
  const isSubmitted = r3.status === 'submitted' || r3.status === 'evaluated';
  const isCompleted = round3State?.status === 'COMPLETED' || r3.status === 'evaluated';
  const bombTimer = round3State?.bombTimerRemaining ?? 30;

  // Block eliminated teams from accessing Round 3
  if (team?.isQualified === false || team?.isEliminated === true || team?.round2?.isQualified === false || team?.round2?.isEliminated === true) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="glass-panel w-full p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/20 to-[#070a13]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10" />
          </div>
          <span className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-xs uppercase tracking-wider">
            ACCESS RESTRICTED • ELIMINATED
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-3 tracking-wider">
            BETTER LUCK NEXT TIME
          </h1>
          <p className="text-gray-300 font-sans text-sm max-w-md mx-auto mt-2">
            You were eliminated and cannot participate in the Grand Finale.
          </p>
        </div>
      </div>
    );
  }

  // Sound effect on Bomb Detonation
  useEffect(() => {
    if (isBombPhase && !isSubmitted) {
      soundEngine.playKlaxonAlarm();
      setShowDetonationModal(true);
      const timer = setTimeout(() => setShowDetonationModal(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [isBombPhase]);

  // Master Draft Autosave
  const handleMasterChange = (e) => {
    const text = e.target.value;
    setMasterDraft(text);
    setIsAutoSaving(true);
    if (masterAutosaveRef.current) clearTimeout(masterAutosaveRef.current);
    masterAutosaveRef.current = setTimeout(() => {
      socket?.emit('team:round3_master_draft', {
        teamId: team.id,
        draftText: text
      });
      setIsAutoSaving(false);
    }, 600);
  };

  // Adapted Draft Autosave
  const handleAdaptedChange = (e) => {
    const text = e.target.value;
    setAdaptedDraft(text);
    setIsAutoSaving(true);
    if (adaptedAutosaveRef.current) clearTimeout(adaptedAutosaveRef.current);
    adaptedAutosaveRef.current = setTimeout(() => {
      socket?.emit('team:round3_bomb_draft', {
        teamId: team.id,
        adaptedText: text
      });
      setIsAutoSaving(false);
    }, 400);
  };

  const togglePillar = (index) => {
    setCheckedPillars(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCopyMetrics = () => {
    const metricsStr = Object.entries(caseItem.scenario?.metrics || {})
      .map(([k, v]) => `• ${k}: ${v}`)
      .join('\n');
    navigator.clipboard.writeText(metricsStr);
    alert('Case study metrics copied to clipboard!');
  };

  const handleSubmitFinal = () => {
    const finalContent = isBombPhase ? (adaptedDraft || masterDraft) : masterDraft;
    if (!finalContent || finalContent.trim().length < 50) {
      setErrorMessage("Final prompt blueprint must contain at least 50 characters.");
      return;
    }

    setIsSubmitting(true);
    socket?.emit('team:round3_submit', { teamId: team.id, finalPrompt: finalContent }, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        soundEngine.playSubmitChime();
      } else {
        setErrorMessage(res?.error || 'Submission failed.');
      }
    });
  };

  const charCount = masterDraft.length;
  const adaptedCharCount = adaptedDraft.length;
  const pillars = caseItem.scenario?.requiredPillars || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Emergency Detonation Flash Banner */}
      {isBombPhase && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-red-500/80 bg-gradient-to-r from-red-950/50 via-rose-950/40 to-black/60 shadow-[0_0_40px_rgba(255,0,0,0.3)] animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600/40 text-red-200 font-mono text-xs font-bold uppercase tracking-wider">
                    CRISIS DIRECTIVE DETONATED
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-wider mt-0.5">
                  {bombItem.headline}
                </h3>
                <p className="text-xs text-red-200 mt-0.5">{bombItem.directive}</p>
              </div>
            </div>

            {/* Bomb Countdown Clock */}
            <div className="px-5 py-2.5 rounded-xl bg-black/60 border border-red-500/60 flex items-center gap-3 shrink-0">
              <Clock className="w-5 h-5 text-red-400 animate-spin" />
              <div>
                <div className="text-[10px] font-mono uppercase text-red-400">Emergency Timer</div>
                <div className="font-mono font-black text-2xl text-red-300">
                  00:{String(bombTimer).padStart(2, '0')}.0
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Round 3 Control Header with Glassmorphism */}
      <div className="glass-panel p-5 rounded-2xl border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
              ROUND 3 • GRAND FINALE
            </span>
            <span className="text-xs font-mono text-gray-400">
              Total Weight: 50 Points (30 Master Strategy + 20 Bomb Adaptation)
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-wider mt-1">
            FINAL PROMPT BATTLE: BUILD. ADAPT. SURVIVE.
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3.5 py-2 rounded-xl border border-white/[0.08]">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-gray-400">Category:</span>
          <span className="text-gray-200 font-semibold">{caseItem.category || 'Strategic Operations'}</span>
        </div>
      </div>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Case Study Dossier & 10 Pillars Checklist (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border-amber-500/30 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="font-display font-bold text-base text-amber-300">
                    CASE STUDY DOSSIER
                  </span>
                </div>
                <button
                  onClick={handleCopyMetrics}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-xs font-mono text-gray-300 flex items-center gap-1 border border-white/[0.08]"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Metrics</span>
                </button>
              </div>

              <h3 className="font-display font-black text-lg text-white mb-2">
                {caseItem.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-sans mb-4">
                {caseItem.scenario?.context}
              </p>

              {/* Numerical Metrics Matrix */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] mb-4">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-2 font-bold">
                  Key Metrics & Constraints:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(caseItem.scenario?.metrics || {}).map(([key, val]) => (
                    <div key={key} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-gray-400 text-[10px] block capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-white font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10 Required Strategic Pillars Tracker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-gray-300 uppercase tracking-wider font-bold">
                    10 Strategic Pillars Checklist:
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    {checkedPillars.size} / {pillars.length} Covered
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {pillars.map((pillar, idx) => {
                    const isChecked = checkedPillars.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => togglePillar(idx)}
                        className={`p-2 rounded-lg text-xs font-mono flex items-start gap-2 cursor-pointer transition-all border ${isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-white/[0.02] border-white/[0.04] text-gray-400 hover:text-gray-200'
                          }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                        )}
                        <span>{pillar}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rubric Breakdown Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200">
              <span className="font-bold text-amber-300 block mb-1">Supreme 50-Pt Adjudication:</span>
              <div className="text-[11px] text-gray-400 space-y-0.5">
                <div>• Master Strategy (30 pts): Comprehension, Persona, Rules, Schema, Depth</div>
                <div>• Bomb Adaptation (20 pts): Pivot Precision, Goal Preservation, Execution</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Master Prompt & Split Crisis Diff Studio (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border-amber-500/30 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(255,184,0,0.08)]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span className="font-display font-bold text-base text-amber-300">
                    {isBombPhase ? "EMERGENCY ADAPTATION STUDIO" : "MASTER PROMPT BLUEPRINT"}
                  </span>
                </div>
                {isAutoSaving && (
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Autosaving...
                  </span>
                )}
              </div>

              {/* Conditional Split Mode vs Master Mode */}
              {!isBombPhase ? (
                <div>
                  <textarea
                    rows={14}
                    placeholder="Construct your comprehensive Master Prompt blueprint here... (Define role persona, quantitative goals, budget boundaries, and structured markdown output tables)"
                    value={masterDraft}
                    onChange={handleMasterChange}
                    disabled={isSubmitted || round3State?.isLocked}
                    className="w-full p-4 rounded-xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-500/80 resize-none shadow-inner"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className={charCount < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                      {charCount < 50 ? `Min 50 chars required (${50 - charCount} left)` : '✓ Length Valid'}
                    </span>
                    <span>{charCount} / 4000 chars</span>
                  </div>
                </div>
              ) : (
                /* Emergency Split Diff Adaptation View */
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                      Original Master Blueprint (Reference):
                    </label>
                    <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-gray-400 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {masterDraft}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-red-400 font-bold mb-1">
                      🚨 Injected Crisis Prompt (Surgical Modification):
                    </label>
                    <textarea
                      rows={10}
                      placeholder="Surgically inject the emergency directive into your strategy..."
                      value={adaptedDraft || masterDraft}
                      onChange={handleAdaptedChange}
                      disabled={isSubmitted}
                      className="w-full p-3.5 rounded-xl glass-input border-red-500/50 text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-red-400 resize-none shadow-inner"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs font-mono text-gray-400">
                      <span className="text-red-300">Auto-commits when timer hits 00:00</span>
                      <span>{(adaptedDraft || masterDraft).length} chars</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSandbox(true)}
                  className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-500/20 border border-amber-500/40 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,184,0,0.15)]"
                >
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Test Blueprint Simulation ({sandboxRunsLeft} left)</span>
                </button>
                <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                  {isSubmitted ? '✓ Submission Sealed' : 'Grand Finale Battle'}
                </span>
              </div>

              <button
                onClick={handleSubmitFinal}
                disabled={isSubmitting || isSubmitted || round3State?.isLocked}
                className={`cyber-btn px-8 py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${isSubmitted
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 cursor-not-allowed'
                    : isBombPhase
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_25px_rgba(255,0,0,0.5)]'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-[0_0_25px_rgba(255,184,0,0.4)]'
                  }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitted ? 'SEALED & SUBMITTED' : isBombPhase ? 'SUBMIT ADAPTED BLUEPRINT' : 'SUBMIT MASTER STRATEGY'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Sandbox Modal */}
      <PromptSandboxModal
        isOpen={showSandbox}
        onClose={() => setShowSandbox(false)}
        round={3}
        challengeType={isBombPhase ? "bomb" : "master"}
        promptText={isBombPhase ? (adaptedDraft || masterDraft) : masterDraft}
        runsRemaining={sandboxRunsLeft}
        onRunSandbox={handleRunSandbox}
        title={isBombPhase ? "Round 3: Emergency Crisis Adaptation Sandbox" : "Round 3: Master Strategy Blueprint Sandbox"}
      />
    </div>
  );
};
