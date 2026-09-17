import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const TimerDisplay = ({
  durationSeconds = 600,
  timerRemaining = 600,
  timerRunning = false,
  timerEndsAt = null,
  size = "md", // "sm", "md", "lg", "giant"
  showIcon = true,
  onTickSound = true
}) => {
  const [displaySeconds, setDisplaySeconds] = useState(timerRemaining);

  useEffect(() => {
    setDisplaySeconds(timerRemaining);
  }, [timerRemaining]);

  // High precision client-side interpolation between 1s server ticks
  useEffect(() => {
    if (!timerRunning || !timerEndsAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timerEndsAt - now) / 1000));
      setDisplaySeconds(remaining);

      if (remaining <= 30 && remaining > 0 && onTickSound) {
        soundEngine.playTimerTick();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerRunning, timerEndsAt, onTickSound]);

  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isCritical = displaySeconds <= 60 && displaySeconds > 0;
  const isWarning = displaySeconds <= 180 && displaySeconds > 60;
  const isZero = displaySeconds === 0;

  let colorClass = "text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]";
  let bgGlow = "border-cyan-500/30 bg-cyan-950/20";

  if (isCritical) {
    colorClass = "text-red-500 drop-shadow-[0_0_16px_rgba(255,51,102,0.8)] animate-pulse";
    bgGlow = "border-red-500/50 bg-red-950/30 ring-2 ring-red-500/20";
  } else if (isWarning) {
    colorClass = "text-amber-400 drop-shadow-[0_0_12px_rgba(255,184,0,0.6)]";
    bgGlow = "border-amber-500/40 bg-amber-950/20";
  } else if (isZero) {
    colorClass = "text-gray-500";
    bgGlow = "border-gray-700 bg-gray-900/40";
  }

  const sizeClasses = {
    sm: "text-lg px-2.5 py-1",
    md: "text-2xl px-4 py-1.5",
    lg: "text-4xl px-6 py-2.5",
    giant: "text-7xl md:text-8xl px-10 py-5 font-black"
  };

  return (
    <div
      className={`inline-flex items-center gap-3 font-mono font-bold rounded-xl border backdrop-blur-md transition-all duration-300 ${bgGlow} ${sizeClasses[size]}`}
    >
      {showIcon && (
        isCritical ? (
          <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
        ) : (
          <Clock className={`w-5 h-5 ${colorClass} ${timerRunning ? 'animate-spin-slow' : ''}`} />
        )
      )}
      <span className={`tracking-widest ${colorClass}`}>
        {formattedTime}
      </span>
      {isCritical && timerRunning && (
        <span className="text-xs uppercase tracking-wider text-red-400 font-sans font-extrabold animate-ping">
          !
        </span>
      )}
    </div>
  );
};
