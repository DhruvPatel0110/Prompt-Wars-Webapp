import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Image as ImageIcon, FileText, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, CheckCircle2, XCircle, Trophy, Send, RefreshCw, 
  AlertCircle, Check, Eye, HelpCircle, ArrowRight, ShieldCheck,
  Maximize2, Compass, Layers, FlaskConical
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { PromptSandboxModal } from './PromptSandboxModal';
import { soundEngine } from '../utils/audio';

export const StudentRound2 = ({ team, round2State, onSwitchRound }) => {
  const { socket } = useSocket();
  const [activeChallenge, setActiveChallenge] = useState('image'); // 'image' | 'report'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [c1Draft, setC1Draft] = useState(team?.round2?.c1_draft || '');
  const [c2Draft, setC2Draft] = useState(team?.round2?.c2_draft || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const sandboxRunsLeft = team?.sandbox?.r2RunsLeft ?? 4;

  const handleRunSandbox = ({ round, challengeType, promptText, testInput }) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket disconnected"));
      socket.emit('team:sandbox_run', {
        teamId: team.id,
        round: 2,
        challengeType: activeChallenge,
        promptText: activeChallenge === 'image' ? c1Draft : c2Draft,
        testInput
      }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Sandbox execution failed."));
      });
    });
  };

  const c1AutosaveRef = useRef(null);
  const c2AutosaveRef = useRef(null);

  const targetImage = round2State?.activeImageChallenge || {
    title: "Solarpunk Neo-Metropolis 2077",
    description: "Futuristic eco-city skyline at golden hour sunset with vertical gardens and air taxis.",
    keyElements: ["Solarpunk architecture", "Sunset lighting", "Air taxis", "Wide angle", "Holographic signs"]
  };

  const targetReport = round2State?.activeReportChallenge || {
    title: "FY 2025-26 Enterprise SaaS Financial Report",
    reportSummary: "Annual performance metrics and quarterly breakdown.",
    targetReportMarkdown: "# EXECUTIVE REPORT\nQuarterly revenue and operating metrics."
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

  // Submit Challenge 1 (Image)
  const handleSubmitC1 = () => {
    if (!c1Draft || c1Draft.trim().length < 50) {
      setErrorMessage("Image reverse-engineering prompt must contain at least 50 characters.");
      return;
    }
    setIsSubmitting(true);
    socket?.emit('team:round2_submit_c1', { teamId: team.id, studentPrompt: c1Draft }, (res) => {
      setIsSubmitting(false);
      if (res?.success) soundEngine.playSubmitChime();
      else setErrorMessage(res?.error || 'Submission failed');
    });
  };

  // Submit Challenge 2 (Report)
  const handleSubmitC2 = () => {
    if (!c2Draft || c2Draft.trim().length < 50) {
      setErrorMessage("Report reverse-engineering prompt must contain at least 50 characters.");
      return;
    }
    setIsSubmitting(true);
    socket?.emit('team:round2_submit_c2', { teamId: team.id, studentPrompt: c2Draft }, (res) => {
      setIsSubmitting(false);
      if (res?.success) soundEngine.playSubmitChime();
      else setErrorMessage(res?.error || 'Submission failed');
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Challenge Navigation Banner with Glassmorphism */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-purple-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
              ROUND 2 • PROMPT REVERSE ENGINEERING
            </span>
            <span className="text-xs font-mono text-gray-400">Total Weight: 40 Points (20 + 20)</span>
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-wider mt-1">
            SEE THE OUTPUT. BUILD THE PROMPT.
          </h2>
        </div>

        {/* Challenge Tabs */}
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveChallenge('image')}
            className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeChallenge === 'image'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'glass-panel text-gray-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>CHALLENGE 1: IMAGE</span>
            {isC1Submitted && <Check className="w-3.5 h-3.5 text-emerald-900 bg-emerald-400 rounded-full p-0.5" />}
          </button>

          <button
            onClick={() => setActiveChallenge('report')}
            className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeChallenge === 'report'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]'
                : 'glass-panel text-gray-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>CHALLENGE 2: REPORT</span>
            {isC2Submitted && <Check className="w-3.5 h-3.5 text-emerald-900 bg-emerald-400 rounded-full p-0.5" />}
          </button>
        </div>
      </div>

      {/* Main Dual Workspace */}
      {activeChallenge === 'image' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Target Image & Zoom Controls (6/12) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="font-display font-bold text-base text-cyan-300">
                      TARGET VISUAL ASSET
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.25))}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 text-xs"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 text-xs"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 text-xs"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/[0.08] flex items-center justify-center p-2 min-h-[300px]">
                  <div 
                    className="transition-transform duration-200 max-w-full"
                    style={{ transform: `scale(${zoomLevel})` }}
                    dangerouslySetInnerHTML={{ __html: targetImage.imageSvg || '' }}
                  />
                </div>

                <div className="mt-4">
                  <h4 className="font-display font-bold text-sm text-white">{targetImage.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 font-sans">{targetImage.description}</p>
                </div>
              </div>

              {/* Rubric Points Checklist */}
              <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                <span className="font-bold text-cyan-300 block mb-1">Image Scoring Rubric (20 Pts):</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                  <div>• Composition & Layout (5 pts)</div>
                  <div>• Colors & Lighting (5 pts)</div>
                  <div>• Subject & Content (5 pts)</div>
                  <div>• Style & Render Cues (5 pts)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Challenge 1 Prompt Editor (6/12) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(0,240,255,0.08)]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                  <span className="font-display font-bold text-base text-cyan-300">
                    YOUR REVERSE-ENGINEERED PROMPT
                  </span>
                  {isAutoSaving && (
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Autosaving...
                    </span>
                  )}
                </div>

                <textarea
                  rows={13}
                  placeholder="Describe camera perspective, lighting, color palette, subjects, and render engine parameters (e.g. 'Octane render, 8k, golden hour...')"
                  value={c1Draft}
                  onChange={handleC1Change}
                  disabled={isC1Submitted || isLocked}
                  className="w-full p-4 rounded-xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/80 resize-none"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={c1Draft.length < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                    {c1Draft.length < 50 ? `Min 50 chars (${50 - c1Draft.length} left)` : '✓ Valid Length'}
                  </span>
                  <span>{c1Draft.length} / 2000 chars</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSandbox(true)}
                    className="px-3.5 py-2 rounded-xl font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Simulation ({sandboxRunsLeft} left)</span>
                  </button>
                  <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                    {isC1Submitted ? '✓ C1 Locked' : '1 submission per challenge'}
                  </span>
                </div>
                <button
                  onClick={handleSubmitC1}
                  disabled={c1Draft.length < 50 || isC1Submitted || isSubmitting || isLocked}
                  className={`cyber-btn px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                    isC1Submitted
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 cursor-not-allowed'
                      : c1Draft.length < 50
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isC1Submitted ? 'CHALLENGE 1 LOCKED' : 'LOCK CHALLENGE 1 PROMPT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CHALLENGE 2: REPORT REVERSE ENGINEERING */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Target Report Viewer (6/12) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl border-purple-500/30 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="font-display font-bold text-base text-purple-300">
                      TARGET STRUCTURED REPORT
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300">
                    MARKDOWN DOCUMENT
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
                  {targetReport.targetReportMarkdown}
                </div>
              </div>

              {/* Rubric Points Checklist */}
              <div className="mt-4 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200">
                <span className="font-bold text-purple-300 block mb-1">Report Scoring Rubric (20 Pts):</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                  <div>• Structure & Sections (5 pts)</div>
                  <div>• Content & Data Accuracy (5 pts)</div>
                  <div>• Table & Markdown Format (5 pts)</div>
                  <div>• Strategic Insights (5 pts)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Challenge 2 Prompt Editor (6/12) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl border-purple-500/30 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(138,43,226,0.08)]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                  <span className="font-display font-bold text-base text-purple-300">
                    YOUR REVERSE-ENGINEERED REPORT PROMPT
                  </span>
                  {isAutoSaving && (
                    <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Autosaving...
                    </span>
                  )}
                </div>

                <textarea
                  rows={13}
                  placeholder="Demand specific report sections, tables with exact column names, financial metrics, and executive insights..."
                  value={c2Draft}
                  onChange={handleC2Change}
                  disabled={isC2Submitted || isLocked}
                  className="w-full p-4 rounded-xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-purple-500/80 resize-none"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={c2Draft.length < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                    {c2Draft.length < 50 ? `Min 50 chars (${50 - c2Draft.length} left)` : '✓ Valid Length'}
                  </span>
                  <span>{c2Draft.length} / 2000 chars</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSandbox(true)}
                    className="px-3.5 py-2 rounded-xl font-mono text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-500/20 border border-purple-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(138,43,226,0.15)]"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                    <span>Test Simulation ({sandboxRunsLeft} left)</span>
                  </button>
                  <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                    {isC2Submitted ? '✓ C2 Locked' : '1 submission per challenge'}
                  </span>
                </div>
                <button
                  onClick={handleSubmitC2}
                  disabled={c2Draft.length < 50 || isC2Submitted || isSubmitting || isLocked}
                  className={`cyber-btn px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                    isC2Submitted
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 cursor-not-allowed'
                      : c2Draft.length < 50
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isC2Submitted ? 'CHALLENGE 2 LOCKED' : 'LOCK CHALLENGE 2 PROMPT'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Prompt Sandbox Modal */}
      <PromptSandboxModal
        isOpen={showSandbox}
        onClose={() => setShowSandbox(false)}
        round={2}
        challengeType={activeChallenge}
        promptText={activeChallenge === 'image' ? c1Draft : c2Draft}
        runsRemaining={sandboxRunsLeft}
        onRunSandbox={handleRunSandbox}
        title={activeChallenge === 'image' ? "Round 2: Image Prompt Simulation" : "Round 2: Report Generation Sandbox"}
      />
    </div>
  );
};
