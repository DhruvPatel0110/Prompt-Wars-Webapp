import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const SEGMENTS = [
  { id: 'A', name: 'CREATIVE', color: '#ff007f', textColor: '#ffffff', desc: 'Storytelling, Ads, Video Scripts' },
  { id: 'B', name: 'BUSINESS', color: '#00f0ff', textColor: '#070a13', desc: 'Marketing, Product Launch, Growth' },
  { id: 'C', name: 'DATA / ANALYSIS', color: '#8a2be2', textColor: '#ffffff', desc: 'Reports, Metrics, Financials' },
  { id: 'D', name: 'REAL-WORLD', color: '#00ff88', textColor: '#070a13', desc: 'Campus Crisis, Event Planning' }
];

export const WheelSpinner = ({
  onSpinEnd,
  targetResult = null,
  disabled = false,
  isSpinning: externalIsSpinning = false
}) => {
  const canvasRef = useRef(null);
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  
  const rotationRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const animFrameRef = useRef(null);
  const lastSectorIndexRef = useRef(-1);

  const numSegments = SEGMENTS.length;
  const arcSize = (2 * Math.PI) / numSegments;

  const isSpinning = internalSpinning || externalIsSpinning;

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    // Draw Outer Glowing Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // Draw Segments
    for (let i = 0; i < numSegments; i++) {
      const segAngle = angle + i * arcSize;
      const seg = SEGMENTS[i];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segAngle, segAngle + arcSize);
      ctx.closePath();

      // Sector Gradient
      const grad = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      grad.addColorStop(0, '#0d1424');
      grad.addColorStop(0.7, seg.color + 'bb');
      grad.addColorStop(1, seg.color);
      ctx.fillStyle = grad;
      ctx.fill();

      // Sector Border
      ctx.strokeStyle = '#070a13';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw Sector Text & Letters
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segAngle + arcSize / 2);

      // Letter A/B/C/D
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Rajdhani", "Orbitron", sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(`GENRE ${seg.id}`, radius - 25, 0);

      // Sector Name
      ctx.font = '600 15px "Inter", sans-serif';
      ctx.fillStyle = seg.textColor === '#070a13' ? '#070a13' : '#e2e8f0';
      ctx.fillText(seg.name, radius - 25, 28);

      ctx.restore();
      ctx.restore();
    }

    // Draw Center Cyber Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 52, 0, 2 * Math.PI);
    ctx.fillStyle = '#070a13';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d1424';
    ctx.fill();

    // Center Lightning Symbol
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px sans-serif';
    ctx.fillText('⚡', centerX, centerY);
    ctx.restore();

    // Track sector pass for sound effect
    const normalizedAngle = ((3 * Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const activeSectorIdx = Math.floor(normalizedAngle / arcSize);
    if (activeSectorIdx !== lastSectorIndexRef.current && activeSectorIdx >= 0 && activeSectorIdx < numSegments) {
      lastSectorIndexRef.current = activeSectorIdx;
      soundEngine.playSpinTick(500 + activeSectorIdx * 100);
    }
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, []);

  const spin = (predeterminedResult = null) => {
    if (isSpinning || disabled) return;

    soundEngine.playUnlockSwoosh();
    setInternalSpinning(true);
    setSelectedSegment(null);

    // Pick target segment
    let targetIndex = Math.floor(Math.random() * numSegments);
    if (predeterminedResult) {
      const idx = SEGMENTS.findIndex(s => s.id === predeterminedResult);
      if (idx !== -1) targetIndex = idx;
    }

    // Calculate exact final angle so pointer lands in middle of target sector
    // Pointer is at Top (3 * PI / 2 radians, or -PI / 2)
    const targetSectorCenter = targetIndex * arcSize + arcSize / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full 360 rotations
    const targetFinalAngle = (3 * Math.PI / 2) - targetSectorCenter + (fullSpins * 2 * Math.PI);

    const startAngle = rotationRef.current % (2 * Math.PI);
    const totalDelta = targetFinalAngle - startAngle;
    const durationMs = 3800;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      
      // Cubic Ease-Out deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalDelta * easeOut;

      rotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = targetFinalAngle;
        drawWheel(targetFinalAngle);
        setInternalSpinning(false);
        const result = SEGMENTS[targetIndex];
        setSelectedSegment(result);
        soundEngine.playVictoryFanfare();
        onSpinEnd?.(result.id, result);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Top Futuristic Glowing Pointer */}
      <div className="absolute top-1 z-20 flex flex-col items-center pointer-events-none drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
        <div className="w-6 h-8 bg-gradient-to-b from-cyan-400 to-cyan-500 clip-triangle shadow-lg animate-pulse" 
             style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
      </div>

      {/* Canvas */}
      <div className="relative p-3 rounded-full bg-gradient-to-b from-cyan-500/20 to-purple-500/10 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] cursor-pointer max-w-full"
          onClick={() => !disabled && !isSpinning && spin(targetResult)}
        />
      </div>

      {/* Spin Button */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={() => spin(targetResult)}
          disabled={disabled || isSpinning}
          className={`cyber-btn px-8 py-3.5 rounded-xl font-display font-bold text-lg uppercase tracking-wider transition-all duration-300 flex items-center gap-3 ${
            disabled
              ? 'bg-gray-800/80 text-gray-500 border border-gray-700 cursor-not-allowed'
              : isSpinning
              ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/50 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'SPINNING SECTOR...' : disabled ? 'SPIN LOCKED' : 'SPIN THE WHEEL'}
        </button>

        {selectedSegment && (
          <div className="mt-3 px-4 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-sm font-semibold tracking-wide animate-fade-in flex items-center gap-2">
            <span>Result:</span>
            <span className="font-bold text-white font-display text-base" style={{ color: selectedSegment.color }}>
              GENRE {selectedSegment.id} — {selectedSegment.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
