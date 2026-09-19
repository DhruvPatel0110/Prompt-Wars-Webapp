import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, CheckCircle2, XCircle, Trophy, Send, RefreshCw, 
  AlertCircle, Check, Eye, HelpCircle, ArrowRight, ShieldCheck,
  Maximize2, Compass, Layers, X, Sliders, Info,
  Camera, Sun, Palette, Wand2, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { soundEngine } from '../utils/audio';

export const StudentRound2 = ({ team, round2State, onSwitchRound }) => {
  const { user } = useAuth();
  const { socket, serverTimer } = useSocket();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const effectiveTeamId = team?.id || user?.teamId;
  const initialPrompt = team?.round2?.submittedPrompt || team?.round2?.draftPrompt || team?.round2?.c1_submittedPrompt || team?.round2?.c1_draft || '';
  const [draftPrompt, setDraftPrompt] = useState(initialPrompt);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const autosaveRef = useRef(null);

  // Synchronize draft if team state updates from server
  useEffect(() => {
    const serverDraft = team?.round2?.submittedPrompt || team?.round2?.draftPrompt || team?.round2?.c1_submittedPrompt || team?.round2?.c1_draft;
    if (serverDraft && !draftPrompt) {
      setDraftPrompt(serverDraft);
    }
  }, [team?.round2]);

  // Assigned Image Challenge for this specific team/PC
  const assignedChallenge = team?.round2?.assignedChallenge || round2State?.activeImageChallenge || {
    id: "r2_img_01",
    challengeNumber: 1,
    title: "Assigned Competition Visual Asset",
    description: "Study the visual details, composition, lighting, and textures to reverse engineer the prompt.",
    imageUrl: "/round2_images/1.png",
    keyElements: ["Camera Angle", "Lighting & Palette", "Primary Subject", "Render Medium"]
  };

  const isLocked = round2State?.isLocked && !serverTimer?.round2?.timerRunning;
  const isSubmitted = !!(team?.round2?.submittedPrompt || team?.round2?.c1_submittedPrompt || team?.round2?.status === 'submitted' || team?.round2?.status === 'evaluated');
  const isEvaluated = !!(team?.round2?.evaluation || team?.round2?.c1_evaluation || team?.round2?.status === 'evaluated');
  const isAdvanceTriggered = !!round2State?.advanceTriggered;
  const isQualified = !!team?.round2?.isQualified;
  const evaluation = team?.round2?.evaluation || team?.round2?.c1_evaluation;
  const totalScore = team?.round2?.totalScore || evaluation?.total_score || 0;

  // If team was eliminated in Round 1, block display entirely
  if (team?.isQualified === false || team?.isEliminated === true) {
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
            You were eliminated in Round 1 and cannot participate in Round 2.
          </p>
        </div>
      </div>
    );
  }

  // Handle Confetti on Qualification
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

  // Prompt Autosave Handler
  const handlePromptChange = (e) => {
    const text = e.target.value;
    setDraftPrompt(text);
    setIsAutoSaving(true);

    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      if (effectiveTeamId) {
        socket?.emit('team:round2_draft_update', {
          teamId: effectiveTeamId,
          draftText: text,
          challengeType: 'image'
        });
      }
      setIsAutoSaving(false);
    }, 600);
  };

  // Submit Prompt Handler
  const handleSubmit = () => {
    if (!draftPrompt || draftPrompt.trim().length < 50) {
      setErrorMessage("Reverse-engineering prompt must contain at least 50 characters.");
      return;
    }
    if (!effectiveTeamId) {
      setErrorMessage("Team ID not found. Please refresh and log in again.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    socket?.emit('team:round2_submit', { 
      teamId: effectiveTeamId, 
      promptText: draftPrompt.trim(),
      studentPrompt: draftPrompt.trim(),
      challengeType: 'image' 
    }, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        soundEngine.playSubmitChime();
        setErrorMessage(null);
      } else {
        setErrorMessage(res?.error || 'Submission failed');
      }
    });
  };

  const wordCount = draftPrompt.trim() ? draftPrompt.trim().split(/\s+/).length : 0;
  const charCount = draftPrompt.length;
  const isMinLengthMet = charCount >= 50;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono flex items-center justify-between shadow-[0_0_25px_rgba(255,0,85,0.2)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Round 2 Header & Objective Banner */}
      <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#0d1424]/80 to-purple-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,240,255,0.06)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold tracking-wider">
              ROUND 2 • REVERSE PROMPT ENGINEERING
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono">
              Maximum Score: 20 Points
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
              Passing Cutoff: Top 50% Advance
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider mt-2">
            SEE THE TARGET IMAGE. RECONSTRUCT THE PROMPT.
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 font-sans max-w-3xl leading-relaxed">
            Your team has been assigned a unique target visual output. Dissect the subject, camera perspective, lighting, color palette, and rendering engine cues to create the closest matching generative prompt.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isSubmitted ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PROMPT LOCKED</span>
            </div>
          ) : isLocked ? (
            <div className="px-4 py-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>ROUND LOCKED</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>DRAFTING ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual Workspace: Image on Left (6/12) + Prompt Editor on Right (6/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Target Visual Asset (6/12) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 flex-1 flex flex-col justify-between shadow-[0_0_25px_rgba(0,240,255,0.08)]">
            <div>
              {/* Header with Title & Zoom Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-cyan-300 block">
                      ASSIGNED TARGET IMAGE
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      ID: {assignedChallenge.id || 'TARGET_01'}
                    </span>
                  </div>
                </div>

                {/* Image Zoom & Lightbox Controls */}
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 text-xs transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 text-xs transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 text-xs transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs transition-colors font-mono flex items-center gap-1"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold hidden sm:inline">Fullscreen</span>
                  </button>
                </div>
              </div>

              {/* Target Image Frame */}
              <div className="relative rounded-xl overflow-hidden bg-black/80 border border-white/[0.1] flex items-center justify-center min-h-[340px] max-h-[440px] group shadow-inner">
                {assignedChallenge.imageUrl ? (
                  <img
                    src={assignedChallenge.imageUrl}
                    alt={assignedChallenge.title || "Target Visual Asset"}
                    className="w-full h-full object-contain transition-transform duration-200 cursor-zoom-in"
                    style={{ transform: `scale(${zoomLevel})` }}
                    onClick={() => setLightboxOpen(true)}
                    onError={(e) => {
                      // Fallback if local image not loaded
                      e.target.onerror = null;
                      e.target.src = "/round2_images/1.png";
                    }}
                  />
                ) : assignedChallenge.imageSvg ? (
                  <div 
                    className="transition-transform duration-200 max-w-full p-4"
                    style={{ transform: `scale(${zoomLevel})` }}
                    dangerouslySetInnerHTML={{ __html: assignedChallenge.imageSvg }}
                  />
                ) : (
                  <div className="text-center text-gray-500 font-mono text-xs p-6">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40 text-cyan-400" />
                    <span>Rendering Target Asset...</span>
                  </div>
                )}

                {/* Floating Click-to-Enlarge Overlay */}
                <div 
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-mono text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Click to Expand</span>
                </div>
              </div>

              {/* Image Description & Visual Clues */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-white tracking-wide">
                    {assignedChallenge.title || "Target Visual Asset"}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Challenge #{assignedChallenge.challengeNumber || 1}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {assignedChallenge.description}
                </p>
              </div>
            </div>

            {/* Visual Criteria Hints */}
            <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-cyan-500/20">
              <span className="font-mono font-bold text-[11px] text-cyan-300 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Key Reverse-Engineering Elements:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Camera Angle & Framing (5 pts)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Lighting & Palette (5 pts)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wand2 className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Subject & Details (5 pts)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Style & Medium Cues (5 pts)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Prompt Re-Engineering Editor (6/12) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border-purple-500/30 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(138,43,226,0.08)]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-purple-300 block">
                      YOUR RECONSTRUCTED PROMPT
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Craft the exact generative AI prompt to reproduce this image
                    </span>
                  </div>
                </div>

                {isAutoSaving && (
                  <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Autosaving...
                  </span>
                )}
              </div>

              {/* Textarea for Writing Prompt */}
              <div className="relative">
                <textarea
                  rows={13}
                  placeholder="Dissect and write the generative prompt: Specify camera perspective (e.g. cinematic low-angle, wide panoramic, macro lens), lighting conditions (golden hour, neon volumetric bloom), primary subjects, background environment, materials/textures, and rendering cues (Octane render, Unreal Engine 5, 8k resolution, photorealistic)..."
                  value={draftPrompt}
                  onChange={handlePromptChange}
                  disabled={isSubmitted}
                  className={`w-full p-4 rounded-xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none resize-none transition-all ${
                    isSubmitted 
                      ? 'bg-black/50 border-emerald-500/40 text-gray-300 cursor-not-allowed'
                      : 'focus:border-purple-500/80 focus:shadow-[0_0_20px_rgba(138,43,226,0.2)]'
                  }`}
                />

                {/* Locked Banner on Textarea if Submitted */}
                {isSubmitted && (
                  <div className="absolute inset-0 rounded-xl bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 shadow-2xl">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>PROMPT LOCKED FOR EVALUATION</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics & Character Counter */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 gap-2">
                <div className="flex items-center gap-3">
                  <span className={isMinLengthMet ? 'text-emerald-400 flex items-center gap-1 font-bold' : 'text-amber-400 flex items-center gap-1'}>
                    {isMinLengthMet ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready to Submit</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Min 50 chars ({50 - charCount} needed)</span>
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>{wordCount} Words</span>
                </div>
                <span>{charCount} / 3000 Chars</span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-end">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!isMinLengthMet || isSubmitted || isSubmitting}
                  className={`w-full sm:w-auto cyber-btn px-6 py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isSubmitted
                      ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 cursor-not-allowed shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                      : !isMinLengthMet
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_25px_rgba(138,43,226,0.4)] hover:brightness-110'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SUBMITTING...</span>
                    </>
                  ) : isSubmitted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>PROMPT LOCKED & SUBMITTED</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>LOCK & SUBMIT PROMPT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Evaluation & Verdict Report Card (Shows after Host Evaluation) */}
      {isEvaluated && (
        <div className="glass-panel p-6 rounded-2xl border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-[#0d1424] to-cyan-950/30 shadow-[0_0_35px_rgba(0,255,136,0.1)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                  OFFICIAL ROUND 2 AI ADJUDICATION REPORT
                </span>
                <h3 className="font-display font-black text-2xl text-white">
                  Score: {totalScore} / 20 Points
                </h3>
              </div>
            </div>

            {isAdvanceTriggered && (
              <div>
                {isQualified ? (
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,136,0.5)]">
                    ★ QUALIFIED FOR ROUND 3 GRAND FINALE ★
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 font-display font-bold text-xs uppercase tracking-wider">
                    ELIMINATED IN ROUND 2
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4-Bar Metric Rubric Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Composition & Framing</span>
              <div className="font-display font-bold text-xl text-cyan-300 mt-1">
                {evaluation?.composition_score ?? 0} / 5
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full rounded-full" 
                  style={{ width: `${((evaluation?.composition_score || 0) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Colors & Lighting</span>
              <div className="font-display font-bold text-xl text-amber-300 mt-1">
                {evaluation?.colors_score ?? 0} / 5
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full" 
                  style={{ width: `${((evaluation?.colors_score || 0) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Subject & Details</span>
              <div className="font-display font-bold text-xl text-purple-300 mt-1">
                {evaluation?.subject_score ?? 0} / 5
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-purple-400 h-full rounded-full" 
                  style={{ width: `${((evaluation?.subject_score || 0) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Style & Medium</span>
              <div className="font-display font-bold text-xl text-emerald-300 mt-1">
                {evaluation?.style_score ?? 0} / 5
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full" 
                  style={{ width: `${((evaluation?.style_score || 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Feedback & Tag Clouds */}
          <div className="mt-4 p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-gray-400 font-bold block mb-1">
                Adjudicator Reasoning:
              </span>
              <p className="text-xs text-gray-200 font-sans leading-relaxed">
                {evaluation?.reasoning || "Evaluation processed successfully."}
              </p>
            </div>

            {Array.isArray(evaluation?.matched_elements) && evaluation.matched_elements.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                  ✓ Elements Accurately Captured:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.matched_elements.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(evaluation?.missed_elements) && evaluation.missed_elements.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                  ⚠ Improvement Opportunities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.missed_elements.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Target Image Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Controls */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div>
                <h3 className="font-display font-bold text-lg text-cyan-300">
                  {assignedChallenge.title || "Target Visual Asset"}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  ID: {assignedChallenge.id} • Use high resolution view to inspect fine textures and lighting
                </span>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged Image */}
            <div className="w-full rounded-2xl overflow-hidden bg-black/90 border border-cyan-500/30 flex items-center justify-center p-2 shadow-2xl max-h-[75vh]">
              {assignedChallenge.imageUrl ? (
                <img
                  src={assignedChallenge.imageUrl}
                  alt={assignedChallenge.title || "Target Visual Asset"}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              ) : (
                <div 
                  className="max-w-full"
                  dangerouslySetInnerHTML={{ __html: assignedChallenge.imageSvg || '' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
