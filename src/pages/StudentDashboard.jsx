import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Lock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, 
  Send, RefreshCw, Trophy, XCircle, FileText, HelpCircle, 
  Check, Info, ShieldCheck, Flame, Award, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { WheelSpinner } from '../components/WheelSpinner';
import { StudentRound2 } from '../components/StudentRound2';
import { StudentRound3 } from '../components/StudentRound3';
import { GrandFinalePodium } from '../components/GrandFinalePodium';
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
  const [selectedRoundTab, setSelectedRoundTab] = useState(null);

  const autosaveTimerRef = useRef(null);

  const team = teamState?.team || {};
  const activeRound = teamState?.activeRound || 1;
  const currentViewRound = selectedRoundTab || activeRound;

  // Sync draft from server state
  useEffect(() => {
    if (team?.draftPrompt && !localDraft) {
      setLocalDraft(team.draftPrompt);
    }
  }, [team]);

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

  // ----------------------------------------------------
  // SCREEN: GRAND FINALE PODIUM (Tournament Winner Reveal)
  // ----------------------------------------------------
  if (teamState?.round3State?.podiumRevealed) {
    return (
      <div className="space-y-4">
        <div className="max-w-6xl mx-auto px-4 pt-4 flex justify-between items-center">
          <button
            onClick={() => setSelectedRoundTab(selectedRoundTab === 3 ? null : 3)}
            className="text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1.5"
          >
            ← Back to Round 3 Submission Workspace
          </button>
        </div>
        <GrandFinalePodium podiumWinners={teamState?.podiumWinners} />
      </div>
    );
  }

  // ----------------------------------------------------
  // TOURNAMENT ROUND ROUTER
  // ----------------------------------------------------

  // Round Navigation Bar if tournament has progressed past Round 1
  const renderRoundSwitcher = () => {
    if (!team.isQualified && activeRound === 1) return null;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[#070a13] border border-[#1f2b48]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoundTab(1)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                currentViewRound === 1
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-white bg-[#0d1424]'
              }`}
            >
              ROUND 1: MAKEOVER {team.evaluation ? `(${team.evaluation.total_score}p)` : ''}
            </button>

            {team.isQualified && (
              <button
                onClick={() => setSelectedRoundTab(2)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  currentViewRound === 2
                    ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(138,43,226,0.4)]'
                    : 'text-gray-400 hover:text-white bg-[#0d1424]'
                }`}
              >
                ROUND 2: REVERSE ENG {team.round2?.totalScore ? `(${team.round2.totalScore}p)` : ''}
              </button>
            )}

            {(team.round2?.isQualified || activeRound === 3) && (
              <button
                onClick={() => setSelectedRoundTab(3)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  currentViewRound === 3
                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(255,184,0,0.4)]'
                    : 'text-gray-400 hover:text-white bg-[#0d1424]'
                }`}
              >
                ROUND 3: GRAND FINALE {team.round3?.evaluation ? `(${team.round3.evaluation.total_score}p)` : ''}
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-gray-400 flex items-center gap-2 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Tournament Round: {activeRound}</span>
          </div>
        </div>
      </div>
    );
  };

  // If viewing Round 3
  if (currentViewRound === 3) {
    return (
      <div>
        {renderRoundSwitcher()}
        <StudentRound3 team={team} round3State={teamState?.round3State} />
      </div>
    );
  }

  // If viewing Round 2
  if (currentViewRound === 2) {
    return (
      <div>
        {renderRoundSwitcher()}
        <StudentRound2 team={team} round2State={teamState?.round2State} />
      </div>
    );
  }

  // Otherwise, default to Round 1
  const isLocked = serverTimer.isLocked || teamState?.roundState?.isLocked;
  const isSubmitted = team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated';
  const hasSpun = !!team.spinResult;
  const charCount = localDraft.length;
  const canSubmit = charCount >= 50 && !isSubmitted && !isLocked && serverTimer.timerRemaining > 0;

  // ----------------------------------------------------
  // ROUND 1: LOCKED LOBBY
  // ----------------------------------------------------
  if (isLocked && !hasSpun && !isSubmitted) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center justify-center text-center">
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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl text-left">
            <div className="cyber-card p-5 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 font-display font-bold flex items-center justify-center text-base mb-3">1</div>
              <h3 className="font-display font-bold text-lg text-white">SPIN TO UNLOCK</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">Spin the wheel to receive your category group (A/B/C/D).</p>
            </div>
            <div className="cyber-card p-5 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-display font-bold flex items-center justify-center text-base mb-3">2</div>
              <h3 className="font-display font-bold text-lg text-white">ANALYZE DEFECTS</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">Inspect the weak prompt. Identify missing persona, context, and format.</p>
            </div>
            <div className="cyber-card p-5 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-display font-bold flex items-center justify-center text-base mb-3">3</div>
              <h3 className="font-display font-bold text-lg text-white">REWRITE & SUBMIT</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">Craft a powerhouse master prompt. Score in top 50% to advance!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 1: SPIN WHEEL
  // ----------------------------------------------------
  if (!hasSpun && !isSubmitted) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
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
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 1: POST-ROUND VERDICT REVEAL
  // ----------------------------------------------------
  if (team.isQualified !== null && team.isQualified !== undefined && !selectedRoundTab) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fade-in">
          {team.isQualified ? (
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
                Outstanding performance, <span className="text-emerald-400 font-bold">{team.name}</span>! Your prompt placed you in the top 50%.
              </p>

              <div className="my-8 p-6 rounded-2xl bg-[#070a13]/80 border border-emerald-500/30 max-w-md mx-auto">
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Round 1 Score</div>
                <div className="font-display font-black text-6xl text-emerald-400 mt-1 drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
                  {team.evaluation?.total_score || 0}
                  <span className="text-2xl text-gray-500 font-normal"> / 20</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoundTab(2)}
                className="cyber-btn px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(0,255,136,0.5)]"
              >
                <span>ENTER ROUND 2: REVERSE ENGINEERING</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="cyber-card w-full p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/30 to-[#0d1424]">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10" />
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-3 tracking-wider">
                BETTER LUCK NEXT TIME
              </h1>
              <p className="text-gray-300 font-sans text-sm max-w-md mx-auto mt-2">
                Thank you for competing in PROMPT WARS! Your score was {team.evaluation?.total_score || 0}/20.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 1: POST-SUBMIT WAITING ROOM
  // ----------------------------------------------------
  if (isSubmitted) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs uppercase tracking-wider">
            SUBMISSION LOCKED & RECORDED
          </span>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
            PROMPT SUCCESSFULLY SUBMITTED!
          </h2>

          <div className="cyber-card w-full text-left mt-8 p-6 rounded-2xl border-cyan-500/30">
            <div className="p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {team.submittedPrompt || localDraft}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 1: WORKSPACE
  // ----------------------------------------------------
  const genre = team.assignedGenre || { name: 'CREATIVE', color: '#ff007f', badge: 'CHALLENGE' };
  const question = team.assignedQuestion || {
    badPrompt: "Make an advertisement for a college fest.",
    context: "General college festival",
    missingElements: ["Audience", "Tone", "Constraints", "Output schema"]
  };

  return (
    <div>
      {renderRoundSwitcher()}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
          </div>
        )}

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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: `${genre.color}33`, color: genre.color }}>
                  {genre.badge || 'CATEGORY'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-sans">{genre.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300">DEFECTIVE</span>
                </div>

                <div className="p-4 rounded-xl bg-[#070a13] border border-red-500/40 text-red-200 font-mono text-base sm:text-lg leading-relaxed shadow-inner">
                  "{question.badPrompt}"
                </div>

                <div className="mt-6 pt-4 border-t border-[#1f2b48]">
                  <h4 className="text-xs font-mono uppercase text-gray-300 mb-2.5">Missing Elements:</h4>
                  <ul className="space-y-1.5 text-xs text-gray-400">
                    {(question.missingElements || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="cyber-card cyber-card-glow-cyan p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                  <span className="font-display font-bold text-lg text-cyan-300">YOUR IMPROVED PROMPT</span>
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

                <textarea
                  rows={14}
                  placeholder="Write your powerhouse prompt here..."
                  value={localDraft}
                  onChange={handleDraftChange}
                  disabled={isSubmitted || isLocked}
                  className="w-full p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/70 resize-none"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={charCount < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                    {charCount < 50 ? `Min 50 chars required (${50 - charCount} left)` : '✓ Length valid'}
                  </span>
                  <span>{charCount} / 2500 chars</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1f2b48] flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">1 submission allowed</span>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canSubmit || isSubmitting}
                  className={`cyber-btn px-8 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${
                    !canSubmit
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'SUBMITTING...' : 'LOCK & SUBMIT PROMPT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="cyber-card w-full max-w-lg rounded-2xl p-6 border-cyan-500/50">
              <h3 className="font-display font-bold text-xl text-white mb-2">CONFIRM FINAL SUBMISSION</h3>
              <p className="text-sm text-gray-300 mb-6">Are you sure you want to lock and submit your prompt for AI evaluation?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="py-2.5 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-300 text-sm font-semibold">
                  BACK TO EDIT
                </button>
                <button onClick={handleSubmitPrompt} className="cyber-btn py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-display font-bold text-sm uppercase tracking-wider">
                  YES, SUBMIT NOW
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
