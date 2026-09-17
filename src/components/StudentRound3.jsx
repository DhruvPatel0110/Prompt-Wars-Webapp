import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, Zap, AlertTriangle, Clock, Send, Sparkles, Trophy, 
  CheckCircle2, FileText, Check, Copy, ArrowRight, ShieldAlert, 
  Sliders, Award, RefreshCw, Layers 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { soundEngine } from '../utils/audio';

export const StudentRound3 = ({ team, round3State }) => {
  const { socket, serverTimer } = useSocket();

  const [masterDraft, setMasterDraft] = useState(team?.round3?.masterDraft || '');
  const [adaptedDraft, setAdaptedDraft] = useState(team?.round3?.adaptedDraft || '');
  const [checkedPillars, setCheckedPillars] = useState(new Set());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetonationModal, setShowDetonationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const masterAutosaveRef = useRef(null);
  const adaptedAutosaveRef = useRef(null);

  const r3 = team?.round3 || {};
  const caseItem = r3.assignedCase || {
    title: "National Tech Fest Participation & Growth Crisis",
    scenario: {
      context: "A premier engineering university is organizing its annual flagship 3-day tech symposium in 30 days.",
      metrics: {
        expectedCapacity: "1,000 Students",
        targetAttendance: "800+ Attendees",
        budget: "₹15,000 Total",
        timeline: "30 Days"
      },
      requiredPillars: [
        "1. Target Audience Segmentation & Personas",
        "2. Guerrilla & Digital Marketing Strategy",
        "3. High-Conversion Content & Social Campaign",
        "4. Campus Ambassador Network & Referral Incentives",
        "5. Granular Budget Allocation Matrix",
        "6. 30-Day Phased Execution Roadmap",
        "7. Gamified Student Engagement Funnel",
        "8. Measurable KPIs & Conversion Funnel",
        "9. Risk Mitigation & Contingency Protocols",
        "10. Expected ROI & Attendance Projections"
      ]
    }
  };

  const bombItem = r3.assignedBomb || {
    headline: "🚨 CRITICAL BUDGET SLASH: ₹15,000 ➔ ₹3,000!",
    description: "Marketing budget slashed to ₹3,000. Paid ads are canceled.",
    directive: "Pivot immediately to zero-cost growth hacking and peer referral loops."
  };

  const phase = round3State?.phase || 'master_draft';
  const isBombPhase = phase === 'bomb_detonated' || r3.status === 'bomb_active';
  const isSubmitted = r3.status === 'submitted' || r3.status === 'evaluated';
  const isCompleted = round3State?.status === 'COMPLETED' || r3.status === 'evaluated';
  const bombTimer = round3State?.bombTimerRemaining ?? 30;

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

  // Submit Final Adaptation
  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    socket?.emit('team:round3_submit', {
      teamId: team.id,
      adaptedPrompt: adaptedDraft || masterDraft
    }, (res) => {
      setIsSubmitting(false);
      if (res?.success) soundEngine.playSubmitChime();
      else setErrorMessage(res?.error || "Submission failed");
    });
  };

  const togglePillar = (idx) => {
    setCheckedPillars(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const insertMetricToken = (token) => {
    setMasterDraft(prev => prev + `\n- ${token}`);
  };

  // ----------------------------------------------------
  // SCREEN: CRISIS MODE (30s FINAL BOMB ADAPTATION)
  // ----------------------------------------------------
  if (isBombPhase && !isSubmitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 animate-pulse-glow">
        {/* Emergency Modal Alert on First Trigger */}
        {showDetonationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-md animate-fade-in">
            <div className="cyber-card max-w-xl text-center p-8 rounded-3xl border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.6)]">
              <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 border-2 border-red-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Flame className="w-10 h-10" />
              </div>
              <h2 className="font-display font-black text-3xl text-white tracking-wider">
                🚨 EMERGENCY INTELLIGENCE DETONATED!
              </h2>
              <div className="my-4 p-4 rounded-xl bg-black/80 border border-red-500 font-display font-bold text-lg text-red-400">
                {bombItem.headline}
              </div>
              <p className="text-gray-300 text-sm">{bombItem.directive}</p>
              <div className="mt-6 text-2xl font-mono font-black text-white">
                30-SECOND COUNTDOWN INITIATED!
              </div>
            </div>
          </div>
        )}

        {/* Crisis Header & Countdown Bar */}
        <div className="cyber-card p-5 rounded-2xl border-red-500 bg-gradient-to-r from-red-950/60 via-black to-red-950/60 shadow-[0_0_30px_rgba(255,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center font-bold animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                  🚨 CRISIS RESPONSE MODE ACTIVE
                </span>
                <h3 className="font-display font-black text-2xl text-white tracking-wider">
                  {bombItem.headline}
                </h3>
              </div>
            </div>

            {/* Micro Countdown Timer */}
            <div className="flex items-center gap-3 bg-black/80 px-6 py-2.5 rounded-2xl border-2 border-red-500 shadow-[0_0_20px_rgba(255,51,102,0.6)]">
              <Clock className="w-6 h-6 text-red-400 animate-spin" />
              <div className="text-right">
                <div className="text-[10px] font-mono text-gray-400 uppercase">Emergency Lock In</div>
                <div className="font-mono font-black text-3xl text-red-400 tracking-wider">
                  00:{String(bombTimer).padStart(2, '0')}s
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-red-200 font-sans mt-3 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30">
            <strong>Impact Directive:</strong> {bombItem.directive} (Auto-commits whatever is written when timer hits 00:00)
          </p>
        </div>

        {/* Split Diff Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Frozen Master Prompt Reference */}
          <div className="lg:col-span-5 cyber-card p-4 rounded-2xl border-[#1f2b48] opacity-75">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2b48] mb-3">
              <span className="text-xs font-mono font-bold text-gray-400">ORIGINAL MASTER PROMPT (FROZEN)</span>
              <span className="text-[10px] font-mono text-gray-500">Read-Only</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#070a13] border border-[#1f2b48] font-mono text-xs text-gray-300 max-h-[420px] overflow-y-auto whitespace-pre-wrap">
              {masterDraft || "No master prompt text drafted."}
            </div>
          </div>

          {/* Right: Surgical Adapted Prompt Editor */}
          <div className="lg:col-span-7 cyber-card p-4 rounded-2xl border-red-500/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1f2b48] mb-3">
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  SURGICAL ADAPTED PROMPT (EDIT NOW)
                </span>
                <span className="text-xs font-mono text-emerald-400">Autosaving realtime</span>
              </div>

              <textarea
                rows={14}
                value={adaptedDraft || masterDraft}
                onChange={handleAdaptedChange}
                placeholder="Make surgical edits to your master prompt to incorporate the new constraint..."
                className="w-full p-4 rounded-xl bg-[#070a13] border border-red-500/50 text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-500/50 resize-none"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-[#1f2b48] flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">
                Chars: {(adaptedDraft || masterDraft).length}
              </span>

              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={isSubmitting}
                className="cyber-btn px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-display font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,0,0.5)] active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>{isSubmitting ? 'COMMITTING...' : 'COMMIT ADAPTED PROMPT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN: POST-SUBMISSION / EVALUATING
  // ----------------------------------------------------
  if (isSubmitted && !isCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(0,240,255,0.3)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs uppercase tracking-wider">
          FINAL BATTLE SEALED
        </span>

        <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
          MASTER & ADAPTED PROMPTS SUBMITTED!
        </h2>

        <p className="text-gray-400 text-sm max-w-md mx-auto mt-2">
          Your strategic prompts are locked in the Supreme AI Adjudicator vault. Awaiting Host Batch Evaluation across all 10 rubric pillars.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-[#0d1424] border border-[#1f2b48] text-xs font-mono text-cyan-300 max-w-md mx-auto">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Awaiting Supreme Adjudication & Grand Finale Podium Reveal...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN: PHASE 1 MASTER PROMPT STUDIO (15-20 Min Phase)
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Top Banner */}
      <div className="cyber-card p-5 rounded-2xl border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#0d1424] to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
              ROUND 3 • GRAND FINALE
            </span>
            <span className="text-xs font-mono text-gray-400">
              Surviving Finalist Team
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider mt-1">
            {caseItem.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
            ⚠️ Stand by for Sudden In-Round Intelligence ("The Bomb")
          </span>
        </div>
      </div>

      {/* Main Dual-Pane Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5/12 cols): Case Dossier & Pillars Checklist */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="cyber-card p-5 sm:p-6 rounded-2xl border-[#1f2b48] flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span className="font-display font-bold text-lg tracking-wider text-amber-300">
                    CASE STUDY DOSSIER
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">RESTRICTED</span>
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                {caseItem.scenario?.context}
              </p>

              {/* Key Scenario Metrics */}
              <div className="mt-4 pt-3 border-t border-[#1f2b48]">
                <span className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  Baseline Constraints & Data:
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                  {Object.entries(caseItem.scenario?.metrics || {}).map(([k, v]) => (
                    <div
                      key={k}
                      onClick={() => insertMetricToken(`${k}: ${v}`)}
                      className="p-2 rounded-lg bg-[#070a13] border border-[#1f2b48] hover:border-cyan-500/40 cursor-pointer text-gray-300 hover:text-cyan-300 transition-colors flex items-center justify-between"
                      title="Click to insert parameter into editor"
                    >
                      <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-bold text-white truncate max-w-[120px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10 Required Strategic Pillars Checklist */}
              <div className="mt-6 pt-4 border-t border-[#1f2b48]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> 10 Required Strategic Pillars:
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {checkedPillars.size} / 10 Covered
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {(caseItem.scenario?.requiredPillars || []).map((pillar, idx) => {
                    const isChecked = checkedPillars.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => togglePillar(idx)}
                        className={`p-2 rounded-lg border text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-[#070a13] border-[#1f2b48] text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <span className="truncate pr-2">{pillar}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-gray-700 text-emerald-500 focus:ring-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rubric Guide */}
            <div className="mt-6 p-3 rounded-xl bg-[#070a13] border border-[#1f2b48] text-[11px] font-mono text-gray-400">
              <span className="text-amber-400 font-bold">Scoring Rubric (50 pts total):</span>
              <div className="grid grid-cols-2 gap-1 pt-1 text-gray-300">
                <div>• Master Strategy: 30 pts</div>
                <div>• Bomb Adaptation: 20 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7/12 cols): Master Prompt Editor */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="cyber-card cyber-card-glow-cyan p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="font-display font-bold text-lg tracking-wider text-cyan-300">
                    MASTER PROMPT STUDIO
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAutoSaving ? (
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Autosaved
                    </span>
                  )}
                </div>
              </div>

              <textarea
                rows={16}
                value={masterDraft}
                onChange={handleMasterChange}
                placeholder="Act as a Principal Growth Marketing Strategist... Instruct the AI model to create an end-to-end strategy covering all 10 pillars, structured tables, persona breakdowns, and contingency roadmaps."
                className="w-full p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 resize-none placeholder:text-gray-600"
              />

              <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                <span className={masterDraft.length < 100 ? 'text-amber-400' : 'text-emerald-400'}>
                  {masterDraft.length < 100 ? `Draft in progress (${masterDraft.length} chars)` : '✓ Comprehensive length'}
                </span>
                <span>{masterDraft.length} / 4500 chars</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f2b48] flex items-center justify-between text-xs font-mono text-gray-400">
              <span>⚡ Keep refining your draft. The Final Bomb can drop at any moment!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
