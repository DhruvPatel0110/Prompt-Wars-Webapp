import React, { useState } from 'react';
import { 
  FlaskConical, Sparkles, X, Play, RefreshCw, CheckCircle2, 
  AlertTriangle, Copy, Check, Info, ShieldCheck, Zap,
  Layers, BarChart2, Activity, Terminal, Lightbulb, ArrowRight
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const PromptSandboxModal = ({
  isOpen,
  onClose,
  round = 1,
  challengeType = 'prompt',
  promptText = '',
  runsRemaining = 5,
  onRunSandbox,
  title = "AI Prompt Testing Sandbox"
}) => {
  const [testInput, setTestInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!promptText || promptText.trim().length < 10) {
      setError("Please type at least 10 characters in your prompt before running a test.");
      return;
    }

    if (runsRemaining <= 0) {
      setError("Sandbox run quota exhausted for this round.");
      return;
    }

    setIsLoading(true);
    setError(null);
    soundEngine?.playSpinTick?.();

    try {
      const res = await onRunSandbox({
        round,
        challengeType,
        promptText,
        testInput
      });

      if (res?.success) {
        setResult(res);
        soundEngine?.playSubmitChime?.();
      } else {
        setError(res?.error || "Sandbox execution failed.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOutput = () => {
    if (result?.outputText) {
      navigator.clipboard.writeText(result.outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const diagnostics = result?.diagnostics;
  const pillars = diagnostics?.pillarsDetected || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl glass-panel border border-cyan-500/40 bg-gradient-to-b from-gray-950/95 via-black/90 to-gray-950/95 shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <FlaskConical className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-bold tracking-wider">
                  ROUND {round} • LIVE SIMULATION RUNNER
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  Quota: <span className={runsRemaining > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{runsRemaining} Runs Left</span>
                </span>
              </div>
              <h3 className="font-display font-black text-lg text-white tracking-wide">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* Top Panel: Active Prompt & Sandbox Trigger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Prompt Under Test Preview (7/12) */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Terminal className="w-3.5 h-3.5" /> Prompt Ready for Live Execution:
                </span>
                <span>{promptText.length} chars</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/70 border border-white/[0.08] font-mono text-xs text-gray-300 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-inner">
                {promptText || <span className="text-gray-600 italic">No prompt text drafted yet.</span>}
              </div>
            </div>

            {/* Right: Optional Test Input & Trigger (5/12) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3 p-4 rounded-2xl glass-panel border-cyan-500/20 bg-cyan-950/10">
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                  Optional Test Query / Context:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 'Target: Gen Z demographic', or leave empty"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-200 font-mono text-xs focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <button
                onClick={handleRun}
                disabled={isLoading || runsRemaining <= 0 || !promptText}
                className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isLoading || runsRemaining <= 0 || !promptText
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Executing Live Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Live Test Simulation ({runsRemaining} left)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Panel: Clean Output Display & Refinement Tips */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-white/[0.08] animate-fade-in">
              {/* Generated Output Terminal Viewer */}
              <div className="rounded-2xl border border-white/[0.12] bg-black/80 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono text-xs font-bold text-gray-200">
                      LIVE AI OUTPUT PREVIEW
                    </span>
                  </div>
                  <button
                    onClick={handleCopyOutput}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-5 font-mono text-xs text-gray-100 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {result.outputText}
                </div>
              </div>

              {/* Actionable Suggestions Box */}
              {diagnostics?.tips?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-cyan-300">Prompt Engineering Tips:</span>
                    <ul className="space-y-0.5 text-gray-300">
                      {diagnostics.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Sandbox runs are for previewing only • Final prompt must still be locked & submitted</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] transition-all flex items-center gap-2"
          >
            <span>Return to Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
