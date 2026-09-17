import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Lock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, 
  Send, RefreshCw, Trophy, XCircle, FileText, HelpCircle, 
  Check, Info, ShieldCheck, Flame, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { WheelSpinner } from '../components/WheelSpinner';
import { soundEngine } from '../utils/audio';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected, serverTimer, teamState } = useSocket();

  const [localDraft, setLocalDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasRevealedGenre, setHasRevealedGenre] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'guidelines'

  const autosaveTimerRef = useRef(null);

  // Sync draft from server state if present
  useEffect(() => {
    if (teamState?.team?.draftPrompt && !localDraft) {
      setLocalDraft(teamState.team.draftPrompt);
    }
  }, [teamState]);

  // Confetti trigger when verdict is received
  useEffect(() => {
    if (teamState?.team?.isQualified) {
      soundEngine.playVictoryFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#00ff88', '#ffd700', '#ff007f']
      });
    } else if (teamState?.team?.isEliminated) {
      soundEngine.playEliminationTone();
    }
  }, [teamState?.team?.isQualified, teamState?.team?.isEliminated]);

  // Autosave Handler
  const handleDraftChange = (e) => {
    const text = e.target.value;
    setLocalDraft(text);
    setIsAutoSaving(true);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (socket && user?.teamId) {
        socket.emit('team:draft_update', {
          teamId: user.teamId,
          draftText: text
        });
      }
      setIsAutoSaving(false);
    }, 600);
  };

  // Wheel Spin Callback
  const handleSpinEnd = (genreId, genreData) => {
    if (socket && user?.teamId) {
      socket.emit('team:spin', { teamId: user.teamId }, (res) => {
        if (!res?.success) {
          setErrorMessage(res?.error || 'Spin synchronization failed.');
        } else {
          setHasRevealedGenre(true);
        }
      });
    }
  };

  // Submit Prompt Handler
  const handleSubmitPrompt = () => {
    if (!localDraft || localDraft.trim().length < 50) {
      setErrorMessage("Your prompt must contain at least 50 characters before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setShowConfirmModal(false);

    socket.emit('team:submit', { teamId: user.teamId, improvedPrompt: localDraft }, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        soundEngine.playSubmitChime();
      } else {
        setErrorMessage(res?.error || 'Submission failed.');
      }
    });
  };

  const team = teamState?.team || {};
  const isLocked = serverTimer.isLocked || teamState?.roundState?.isLocked;
  const isSubmitted = team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated';
  const hasSpun = !!team.spinResult;
  const charCount = localDraft.length;
  const canSubmit = charCount >= 50 && !isSubmitted && !isLocked && serverTimer.timerRemaining > 0;

  // ----------------------------------------------------
  // SCREEN 1: LOCKED LOBBY (Host has not unlocked yet)
  // ----------------------------------------------------
  if (isLocked && !hasSpun && !isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(0,240,255,0.2)] animate-cyber-pulse">
          <Lock className="w-10 h-10 text-cyan-400" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs uppercase tracking-widest mb-3">
          STANDBY PROTOCOL
        </span>

        <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-wider max-w-2xl">
          ROUND 1: PROMPT MAKEOVER
        </h1>
        <p className="text-gray-400 font-sans text-base max-w-xl mt-3 leading-relaxed">
          Welcome <span className="text-cyan-400 font-bold">{user?.teamName || user?.teamId}</span>. The arena is currently locked. The countdown will begin as soon as the Host unlocks Round 1.
        </p>

        {/* Round 1 Briefing Card */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl text-left">
          <div className="cyber-card p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 font-display font-bold flex items-center justify-center text-base mb-3">
              1
            </div>
            <h3 className="font-display font-bold text-lg text-white">SPIN TO UNLOCK</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Spin the 4-genre cyber wheel to receive your assigned challenge category (A, B, C, or D).
            </p>
          </div>

          <div className="cyber-card p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-display font-bold flex items-center justify-center text-base mb-3">
              2
            </div>
            <h3 className="font-display font-bold text-lg text-white">ANALYZE DEFECTS</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Inspect the weak prompt. Identify missing context, persona, constraints, and output format.
            </p>
          </div>

          <div className="cyber-card p-5 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-display font-bold flex items-center justify-center text-base mb-3">
              3
            </div>
            <h3 className="font-display font-bold text-lg text-white">REWRITE & SUBMIT</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Craft a powerhouse master prompt. Score in the top 50% to advance to Round 2.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-xs font-mono text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Synchronizing with Host Clock...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 2: SPIN WHEEL (Unassigned genre)
  // ----------------------------------------------------
  if (!hasSpun && !isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono text-xs uppercase tracking-wider">
            STEP 1 • CATEGORY SELECTION
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
            SPIN TO REVEAL YOUR GENRE
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            Click the wheel to spin. Your category will determine the bad prompt you must makeover.
          </p>
        </div>

        <WheelSpinner onSpinEnd={handleSpinEnd} />
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 3: POST-ROUND VERDICT REVEAL (Advance Triggered)
  // ----------------------------------------------------
  if (team.isQualified !== null && team.isQualified !== undefined) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
        {team.isQualified ? (
          /* QUALIFIED BANNER */
          <div className="cyber-card cyber-card-glow-green w-full p-8 sm:p-10 rounded-3xl border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-[#0d1424]">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(0,255,136,0.4)] animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <span className="px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold uppercase tracking-widest">
              OFFICIAL VERDICT • ADVANCING
            </span>

            <h1 className="font-display font-black text-4xl sm:text-5xl text-white mt-3 tracking-wider">
              🎉 QUALIFIED FOR ROUND 2!
            </h1>

            <p className="text-gray-300 font-sans text-base max-w-lg mx-auto mt-2">
              Outstanding performance, <span className="text-emerald-400 font-bold">{team.name}</span>! Your rewritten prompt placed you in the top 50%.
            </p>

            {/* Score Showcase */}
            <div className="my-8 p-6 rounded-2xl bg-[#070a13]/80 border border-emerald-500/30 max-w-md mx-auto">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Round 1 Score</div>
              <div className="font-display font-black text-6xl text-emerald-400 mt-1 drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
                {team.evaluation?.total_score || 0}
                <span className="text-2xl text-gray-500 font-normal"> / 20</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">
                Tournament Rank: <span className="text-white font-bold">#{team.rank}</span>
              </div>

              {team.evaluation && (
                <div className="mt-4 pt-4 border-t border-[#1f2b48] grid grid-cols-5 gap-1 text-[11px] font-mono text-center">
                  <div>
                    <span className="text-gray-500">Clarity</span>
                    <div className="font-bold text-cyan-400">{team.evaluation.clarity_score}/5</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Context</span>
                    <div className="font-bold text-purple-400">{team.evaluation.context_score}/4</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Constraints</span>
                    <div className="font-bold text-amber-400">{team.evaluation.constraints_score}/4</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Format</span>
                    <div className="font-bold text-emerald-400">{team.evaluation.format_score}/3</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Creativity</span>
                    <div className="font-bold text-pink-400">{team.evaluation.creativity_score}/4</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 font-mono flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Please stand by for Host instructions to start Round 2: Prompt Reverse Engineering!</span>
            </div>
          </div>
        ) : (
          /* ELIMINATION BANNER */
          <div className="cyber-card w-full p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/30 to-[#0d1424]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>

            <span className="px-4 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono font-bold uppercase tracking-widest">
              OFFICIAL TOURNAMENT VERDICT
            </span>

            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-3 tracking-wider">
              BETTER LUCK NEXT TIME
            </h1>

            <p className="text-gray-300 font-sans text-sm max-w-md mx-auto mt-2">
              Thank you for competing in PROMPT WARS! Your team did not cross the 50% cutoff for Round 2.
            </p>

            <div className="my-6 p-5 rounded-2xl bg-[#070a13]/80 border border-[#1f2b48] max-w-sm mx-auto">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Your Score</div>
              <div className="font-display font-bold text-4xl text-red-400 mt-1">
                {team.evaluation?.total_score || 0}
                <span className="text-lg text-gray-500 font-normal"> / 20</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">
                Rank: #{team.rank}
              </div>
            </div>

            <p className="text-xs text-gray-500 font-mono">
              Feel free to watch the live projector screen as the tournament proceeds!
            </p>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 4: POST-SUBMIT WAITING ROOM
  // ----------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs uppercase tracking-wider">
          SUBMISSION LOCKED & RECORDED
        </span>

        <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
          PROMPT SUCCESSFULLY SUBMITTED!
        </h2>

        <p className="text-gray-400 text-sm max-w-md mx-auto mt-2">
          Your prompt has been locked in the vault. Waiting for the timer to expire and the AI Evaluator to grade all 50 teams.
        </p>

        {/* Read-only Submission Card */}
        <div className="cyber-card w-full text-left mt-8 p-6 rounded-2xl border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-[#1f2b48] pb-3 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Your Recorded Makeover:
            </span>
            <span className="text-xs font-mono text-gray-500">
              Submitted at: {team.submittedAt ? new Date(team.submittedAt).toLocaleTimeString() : 'Recorded'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {team.submittedPrompt || localDraft}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 px-5 py-2.5 rounded-xl bg-[#0d1424] border border-[#1f2b48] text-xs font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Awaiting Host AI Batch Evaluation & Verdict Release...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 5: MAIN PROMPT MAKEOVER CHALLENGE WORKSPACE
  // ----------------------------------------------------
  const genre = team.assignedGenre || { name: 'CREATIVE', color: '#ff007f', badge: 'CHALLENGE' };
  const question = team.assignedQuestion || {
    badPrompt: "Make an advertisement for a college fest.",
    context: "General college festival",
    missingElements: ["Audience", "Tone", "Constraints", "Output schema"]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Top Banner: Assigned Genre & Instructions */}
      <div className="cyber-card p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-cyan-500/30">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-2xl shadow-lg shrink-0"
            style={{ backgroundColor: `${genre.color}22`, color: genre.color, border: `1px solid ${genre.color}55` }}
          >
            {team.spinResult || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl text-white tracking-wider">
                GENRE {team.spinResult}: {genre.name}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ backgroundColor: `${genre.color}33`, color: genre.color }}
              >
                {genre.badge || 'CATEGORY'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              {genre.description || "Transform the weak prompt into a high-precision prompt."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-mono text-gray-400 uppercase">Single Edit Rule</div>
            <div className="text-xs font-mono font-bold text-amber-400">1 SUBMISSION ALLOWED</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Challenge Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5/12 width): BAD PROMPT & CRITIQUE */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="cyber-card p-5 sm:p-6 rounded-2xl border-red-500/30 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="font-display font-bold text-lg tracking-wider text-red-400">
                    BAD PROMPT (ASSIGNED)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300">
                  DEFECTIVE
                </span>
              </div>

              {/* Bad Prompt Box (Monospace code style) */}
              <div className="p-4 rounded-xl bg-[#070a13] border border-red-500/40 text-red-200 font-mono text-base sm:text-lg leading-relaxed shadow-inner select-all">
                "{question.badPrompt}"
              </div>

              {question.context && (
                <div className="mt-3 text-xs text-gray-400 font-sans">
                  <span className="font-semibold text-gray-300">Context:</span> {question.context}
                </div>
              )}

              {/* Deficiencies Breakdown */}
              <div className="mt-6 pt-4 border-t border-[#1f2b48]">
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-300 mb-2.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Why is this prompt weak?
                </h4>
                <ul className="space-y-2">
                  {(question.missingElements || [
                    "Missing AI persona and role definition",
                    "No explicit target audience or tone",
                    "Missing constraints and negative rules",
                    "No defined output structure or schema"
                  ]).map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-red-400 shrink-0 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rubric Quick Guide */}
            <div className="mt-6 p-3 rounded-xl bg-[#070a13]/80 border border-[#1f2b48] text-[11px] font-mono text-gray-400 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Scoring Rubric (20 Points Total):
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 text-gray-300">
                <div>• Clarity: 5 pts</div>
                <div>• Context: 4 pts</div>
                <div>• Constraints: 4 pts</div>
                <div>• Output Format: 3 pts</div>
                <div className="col-span-2">• Creativity: 4 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7/12 width): IMPROVED PROMPT EDITOR */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="cyber-card cyber-card-glow-cyan p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="font-display font-bold text-lg tracking-wider text-cyan-300">
                    YOUR IMPROVED PROMPT
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

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={14}
                  placeholder="Write your powerhouse prompt here... E.g., 'Act as a Senior Marketing Strategist. Create a 30-second promotional script...'"
                  value={localDraft}
                  onChange={handleDraftChange}
                  disabled={isSubmitted || isLocked}
                  className="w-full p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 resize-none transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Character Counter & Minimum Length Guide */}
              <div className="mt-2 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={charCount < 50 ? 'text-amber-400' : 'text-emerald-400 font-bold'}>
                    {charCount < 50 ? `⚠ Min 50 characters required (${50 - charCount} left)` : `✓ Length validated`}
                  </span>
                </div>
                <div className="text-gray-400">
                  <span className={charCount > 2000 ? 'text-red-400 font-bold' : 'text-cyan-400 font-semibold'}>
                    {charCount}
                  </span>
                  <span className="text-gray-600"> / 2500 chars</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-6 pt-4 border-t border-[#1f2b48] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400 font-mono">
                <p>⚠️ Once submitted, your prompt is locked permanently.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!canSubmit || isSubmitting}
                className={`cyber-btn px-8 py-3 rounded-xl font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                  !canSubmit
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'SUBMITTING...' : 'LOCK & SUBMIT PROMPT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-cyan-500/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">CONFIRM FINAL SUBMISSION</h3>
                <p className="text-xs text-gray-400 font-mono">Team: {user?.teamName || user?.teamId}</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Are you sure you want to submit your prompt? You will <strong className="text-amber-400">NOT</strong> be able to edit or resubmit after confirming.
            </p>

            <div className="p-3.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-xs font-mono text-gray-300 max-h-36 overflow-y-auto mb-6 whitespace-pre-wrap">
              "{localDraft}"
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] hover:border-gray-600 text-gray-300 text-sm font-semibold transition-colors"
              >
                BACK TO EDIT
              </button>

              <button
                type="button"
                onClick={handleSubmitPrompt}
                disabled={isSubmitting}
                className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-display font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                {isSubmitting ? 'TRANSMITTING...' : 'YES, SUBMIT NOW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
