import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Image as ImageIcon, FileText, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, CheckCircle2, XCircle, Trophy, Send, RefreshCw, 
  AlertCircle, Check, Eye, HelpCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { soundEngine } from '../utils/audio';

export const StudentRound2 = ({ team, round2State, onSwitchRound }) => {
  const { socket } = useSocket();
  const [activeChallenge, setActiveChallenge] = useState('image'); // 'image' | 'report'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [c1Draft, setC1Draft] = useState(team?.round2?.c1_draft || '');
  const [c2Draft, setC2Draft] = useState(team?.round2?.c2_draft || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const c1AutosaveRef = useRef(null);
  const c2AutosaveRef = useRef(null);

  const targetImage = round2State?.activeImageChallenge || {
    title: "Solarpunk Neo-Metropolis 2077",
    description: "Futuristic eco-city skyline at golden hour sunset with vertical gardens and air taxis."
  };

  const targetReport = round2State?.activeReportChallenge || {
    title: "FY 2025-26 Enterprise SaaS Financial Report",
    reportSummary: "Annual performance metrics and quarterly breakdown."
  };

  const isLocked = round2State?.isLocked;
  const isC1Submitted = !!team?.round2?.c1_submittedPrompt;
  const isC2Submitted = !!team?.round2?.c2_submittedPrompt;
  const isAdvanceTriggered = round2State?.advanceTriggered;
  const isQualified = team?.round2?.isQualified;

  useEffect(() => {
    if (isAdvanceTriggered && isQualified) {
      soundEngine.playVictoryFanfare();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#00ff88', '#ffd700', '#ff007f']
      });
    }
  }, [isAdvanceTriggered, isQualified]);

  // C1 Draft Autosave
  const handleC1Change = (e) => {
    const text = e.target.value;
    setC1Draft(text);
    setIsAutoSaving(true);
    if (c1AutosaveRef.current) clearTimeout(c1AutosaveRef.current);
    c1AutosaveRef.current = setTimeout(() => {
      socket?.emit('team:round2_draft_update', {
        teamId: team.id,
        challengeType: 'image',
        draftText: text
      });
      setIsAutoSaving(false);
    }, 600);
  };

  // C2 Draft Autosave
  const handleC2Change = (e) => {
    const text = e.target.value;
    setC2Draft(text);
    setIsAutoSaving(true);
    if (c2AutosaveRef.current) clearTimeout(c2AutosaveRef.current);
    c2AutosaveRef.current = setTimeout(() => {
      socket?.emit('team:round2_draft_update', {
        teamId: team.id,
        challengeType: 'report',
        draftText: text
      });
      setIsAutoSaving(false);
    }, 600);
  };

  // Submit C1
  const handleSubmitC1 = () => {
    if (c1Draft.trim().length < 30) {
      setErrorMessage("Image prompt must be at least 30 characters.");
      return;
    }
    setIsSubmitting(true);
    socket?.emit('team:round2_submit', {
      teamId: team.id,
      challengeType: 'image',
      promptText: c1Draft
    }, (res) => {
      setIsSubmitting(false);
      if (res?.success) soundEngine.playSubmitChime();
      else setErrorMessage(res?.error || "Submission failed");
    });
  };

  // Submit C2
  const handleSubmitC2 = () => {
    if (c2Draft.trim().length < 30) {
      setErrorMessage("Report prompt must be at least 30 characters.");
      return;
    }
    setIsSubmitting(true);
    socket?.emit('team:round2_submit', {
      teamId: team.id,
      challengeType: 'report',
      promptText: c2Draft
    }, (res) => {
      setIsSubmitting(false);
      if (res?.success) soundEngine.playSubmitChime();
      else setErrorMessage(res?.error || "Submission failed");
    });
  };

  // ----------------------------------------------------
  // SCREEN: ROUND 2 ADVANCE VERDICT
  // ----------------------------------------------------
  if (isAdvanceTriggered && isQualified !== null && isQualified !== undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center animate-fade-in">
        {isQualified ? (
          <div className="cyber-card cyber-card-glow-green p-8 sm:p-10 rounded-3xl border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-[#0d1424]">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(0,255,136,0.4)] animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <span className="px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold uppercase tracking-widest">
              OFFICIAL VERDICT • ADVANCING TO GRAND FINALE
            </span>

            <h1 className="font-display font-black text-4xl sm:text-5xl text-white mt-3 tracking-wider">
              🎉 QUALIFIED FOR ROUND 3!
            </h1>

            <p className="text-gray-300 font-sans text-base max-w-lg mx-auto mt-2">
              Congratulations <span className="text-emerald-400 font-bold">{team.name}</span>! Your reverse-engineering prompts placed you in the surviving top 25%.
            </p>

            {/* Score Breakdown */}
            <div className="my-8 p-6 rounded-2xl bg-[#070a13]/80 border border-emerald-500/30 max-w-md mx-auto">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Round 2 Score</div>
              <div className="font-display font-black text-6xl text-emerald-400 mt-1 drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
                {team?.round2?.totalScore || 0}
                <span className="text-2xl text-gray-500 font-normal"> / 40</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#1f2b48] text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                  <div className="text-gray-400">Challenge 1 (Image)</div>
                  <div className="text-lg font-bold text-cyan-300 mt-0.5">
                    {team?.round2?.c1_evaluation?.total_score || 0} / 20
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                  <div className="text-gray-400">Challenge 2 (Report)</div>
                  <div className="text-lg font-bold text-purple-300 mt-0.5">
                    {team?.round2?.c2_evaluation?.total_score || 0} / 20
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 font-mono flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Prepare for Round 3: The Final Prompt Battle & The 30s Final Bomb!</span>
            </div>
          </div>
        ) : (
          <div className="cyber-card p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/30 to-[#0d1424]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>

            <span className="px-4 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono font-bold uppercase tracking-widest">
              ROUND 2 ELIMINATION
            </span>

            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-3 tracking-wider">
              VALIANT EFFORT!
            </h1>

            <p className="text-gray-300 font-sans text-sm max-w-md mx-auto mt-2">
              Thank you for competing, <span className="text-white font-bold">{team.name}</span>. You did not cross the 50% cutoff for the Grand Finale.
            </p>

            <div className="my-6 p-5 rounded-2xl bg-[#070a13]/80 border border-[#1f2b48] max-w-sm mx-auto">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Round 2 Combined Score</div>
              <div className="font-display font-bold text-4xl text-red-400 mt-1">
                {team?.round2?.totalScore || 0}
                <span className="text-lg text-gray-500 font-normal"> / 40</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header & Challenge Switcher Tabs */}
      <div className="cyber-card p-5 rounded-2xl border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
              ROUND 2 • REVERSE ENGINEERING
            </span>
            <span className="text-xs font-mono text-gray-400">
              {isC1Submitted && isC2Submitted ? "✓ Both Challenges Submitted" : "2 Challenges Active"}
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider mt-1">
            SEE THE OUTPUT. BUILD THE PROMPT.
          </h2>
        </div>

        {/* Challenge Tabs */}
        <div className="flex items-center gap-2 bg-[#070a13] p-1.5 rounded-xl border border-[#1f2b48]">
          <button
            onClick={() => setActiveChallenge('image')}
            className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeChallenge === 'image'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>CHALLENGE 1: IMAGE</span>
            {isC1Submitted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveChallenge('report')}
            className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeChallenge === 'report'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>CHALLENGE 2: REPORT</span>
            {isC2Submitted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: CHALLENGE 1 - IMAGE REVERSE ENGINEERING       */}
      {/* ---------------------------------------------------- */}
      {activeChallenge === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Target Image Preview (Left 6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="cyber-card p-5 rounded-2xl border-cyan-500/30 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan-400" />
                    <span className="font-display font-bold text-lg tracking-wider text-cyan-300">
                      TARGET VISUAL OUTPUT
                    </span>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-[#070a13] p-1 rounded-lg border border-[#1f2b48]">
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                      className="p-1.5 rounded text-gray-400 hover:text-cyan-400"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                      className="p-1.5 rounded text-gray-400 hover:text-cyan-400"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 rounded text-gray-400 hover:text-cyan-400"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-cyan-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                  </div>
                </div>

                {/* SVG Render Box */}
                <div className="relative overflow-hidden rounded-xl bg-[#070a13] border border-[#1f2b48] aspect-video flex items-center justify-center select-none">
                  <div
                    className="w-full h-full transition-transform duration-200 origin-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                    dangerouslySetInnerHTML={{ __html: targetImage.imageSvg || '' }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                    🔒 Protected Target Asset
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-display font-bold text-base text-white">{targetImage.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{targetImage.description}</p>
                </div>

                {/* Visual Reverse Engineering Helper Guide */}
                <div className="mt-4 pt-3 border-t border-[#1f2b48]">
                  <span className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1 mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Key Visual Criteria to Reconstruct:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300">
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <span className="text-cyan-400">1. Composition</span> (Perspective, crop, angles)
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <span className="text-amber-400">2. Lighting</span> (Sunlight, glow, contrast)
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <span className="text-emerald-400">3. Subjects</span> (Objects, architecture, details)
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <span className="text-pink-400">4. Style</span> (Render engine, realism tokens)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reverse Prompt Editor (Right 6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="cyber-card cyber-card-glow-cyan p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span className="font-display font-bold text-lg tracking-wider text-cyan-300">
                      REVERSE-ENGINEERED PROMPT
                    </span>
                  </div>

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
                  rows={13}
                  placeholder="Write the generative prompt that would recreate the target visual above... Specify camera angle, atmosphere, objects, lighting, color palette, and rendering style."
                  value={c1Draft}
                  onChange={handleC1Change}
                  disabled={isC1Submitted || isLocked}
                  className="w-full p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 resize-none"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={c1Draft.length < 30 ? 'text-amber-400' : 'text-emerald-400'}>
                    {c1Draft.length < 30 ? `Min 30 chars (${30 - c1Draft.length} left)` : '✓ Length valid'}
                  </span>
                  <span>{c1Draft.length} / 2500 chars</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-[#1f2b48] flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">
                  {isC1Submitted ? "✓ Challenge 1 Submitted & Locked" : "Single submission allowed"}
                </span>

                <button
                  type="button"
                  onClick={handleSubmitC1}
                  disabled={c1Draft.length < 30 || isC1Submitted || isSubmitting || isLocked}
                  className={`cyber-btn px-6 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${
                    isC1Submitted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                      : c1Draft.length < 30
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isC1Submitted ? 'C1 SUBMITTED' : (isSubmitting ? 'LOCKING...' : 'LOCK CHALLENGE 1')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: CHALLENGE 2 - REPORT REVERSE ENGINEERING      */}
      {/* ---------------------------------------------------- */}
      {activeChallenge === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Target Report Preview (Left 6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="cyber-card p-5 rounded-2xl border-purple-500/30 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <span className="font-display font-bold text-lg tracking-wider text-purple-300">
                      TARGET STRUCTURED REPORT
                    </span>
                  </div>
                  <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                    AUDIT REPORT
                  </span>
                </div>

                {/* Markdown / Formatted Report Box */}
                <div className="p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-200 font-sans text-xs sm:text-sm leading-relaxed max-h-[460px] overflow-y-auto whitespace-pre-wrap font-mono select-all">
                  {targetReport.targetReportMarkdown}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#070a13] border border-[#1f2b48] text-xs font-mono text-gray-400">
                <span className="text-purple-400 font-bold">Goal:</span> Reverse-engineer a prompt that instructs an AI to output this exact structure, tables, KPIs, and analysis.
              </div>
            </div>
          </div>

          {/* Reverse Prompt Editor (Right 6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="cyber-card cyber-card-glow-purple p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2b48] mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-display font-bold text-lg tracking-wider text-purple-300">
                      REVERSE-ENGINEERED PROMPT
                    </span>
                  </div>

                  {isAutoSaving ? (
                    <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Autosaved
                    </span>
                  )}
                </div>

                <textarea
                  rows={13}
                  placeholder="Write the master prompt that would instruct an AI to generate the exact executive summary, 4-quarter table, unit economics, and outlook shown on the left..."
                  value={c2Draft}
                  onChange={handleC2Change}
                  disabled={isC2Submitted || isLocked}
                  className="w-full p-4 rounded-xl bg-[#070a13] border border-[#1f2b48] text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 resize-none"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={c2Draft.length < 30 ? 'text-amber-400' : 'text-emerald-400'}>
                    {c2Draft.length < 30 ? `Min 30 chars (${30 - c2Draft.length} left)` : '✓ Length valid'}
                  </span>
                  <span>{c2Draft.length} / 2500 chars</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-[#1f2b48] flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">
                  {isC2Submitted ? "✓ Challenge 2 Submitted & Locked" : "Single submission allowed"}
                </span>

                <button
                  type="button"
                  onClick={handleSubmitC2}
                  disabled={c2Draft.length < 30 || isC2Submitted || isSubmitting || isLocked}
                  className={`cyber-btn px-6 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${
                    isC2Submitted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                      : c2Draft.length < 30
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isC2Submitted ? 'C2 SUBMITTED' : (isSubmitting ? 'LOCKING...' : 'LOCK CHALLENGE 2')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
