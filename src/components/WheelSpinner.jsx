import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const SEGMENTS = [
  { 
    id: 'A', 
    name: 'CREATIVE', 
    sub: 'Storytelling & Ads',
    color: '#ff007f', 
    textColor: '#ffffff', 
    icon: '✨'
  },
  { 
    id: 'B', 
    name: 'BUSINESS', 
    sub: 'Marketing & Strategy',
    color: '#00f0ff', 
    textColor: '#070a13', 
    icon: '💼'
  },
  { 
    id: 'C', 
    name: 'DATA / ANALYSIS', 
    sub: 'Reports & Metrics',
    color: '#8a2be2', 
    textColor: '#ffffff', 
    icon: '📊'
  },
  { 
    id: 'D', 
    name: 'REAL-WORLD', 
    sub: 'Problem Solving',
    color: '#00ff88', 
    textColor: '#070a13', 
    icon: '🌍'
  }
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
    const radius = Math.min(centerX, centerY) - 30;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Outer Cyber LED Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 16, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 24;
    ctx.stroke();

    // LED Perimeter Dots
    const numDots = 24;
    for (let d = 0; d < numDots; d++) {
      const dotAngle = (d * (2 * Math.PI) / numDots) + (angle * 0.3);
      const dotX = centerX + (radius + 16) * Math.cos(dotAngle);
      const dotY = centerY + (radius + 16) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, d % 2 === 0 ? 3.5 : 2, 0, 2 * Math.PI);
      ctx.fillStyle = d % 2 === 0 ? '#00f0ff' : '#ff007f';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw 4 Vibrant Sectors
    for (let i = 0; i < numSegments; i++) {
      const segAngle = angle + i * arcSize;
      const seg = SEGMENTS[i];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segAngle, segAngle + arcSize);
      ctx.closePath();

      // Multi-stop Radiant Gradient
      const grad = ctx.createRadialGradient(centerX, centerY, radius * 0.15, centerX, centerY, radius);
      grad.addColorStop(0, '#060a14');
      grad.addColorStop(0.5, seg.color + 'aa');
      grad.addColorStop(0.9, seg.color + 'ee');
      grad.addColorStop(1, seg.color);
      ctx.fillStyle = grad;
      ctx.fill();

      // Crisp Sector Divider
      ctx.strokeStyle = '#05070e';
      ctx.lineWidth = 6;
      ctx.stroke();

      // 3. Draw Typography & Icons per Sector
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segAngle + arcSize / 2);

      // Genre Large Badge
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Icon
      ctx.font = '28px sans-serif';
      ctx.fillText(seg.icon, radius - 20, -32);

      // Genre ID & Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px "Rajdhani", "Orbitron", sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 12;
      ctx.fillText(`GENRE ${seg.id}`, radius - 20, 4);

      // Genre Title
      ctx.font = 'bold 18px "Rajdhani", "Inter", sans-serif';
      ctx.fillStyle = seg.textColor === '#070a13' ? '#070a13' : '#e0f2fe';
      ctx.fillText(seg.name, radius - 20, 36);

      // Subtitle
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillStyle = seg.textColor === '#070a13' ? '#1e293b' : 'rgba(255,255,255,0.85)';
      ctx.fillText(seg.sub, radius - 20, 56);

      ctx.restore();
      ctx.restore();
    }

    // 4. Draw Center Cyber Hub (Multi-layer Metallic Core)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 68, 0, 2 * Math.PI);
    ctx.fillStyle = '#050811';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 54, 0, 2 * Math.PI);
    const hubGrad = ctx.createLinearGradient(centerX - 40, centerY - 40, centerX + 40, centerY + 40);
    hubGrad.addColorStop(0, '#0f172a');
    hubGrad.addColorStop(0.5, '#1e293b');
    hubGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // Center Lightning Graphic
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('⚡', centerX, centerY);
    ctx.restore();

    // 5. Sound Tick Trigger
    const normalizedAngle = ((3 * Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const activeSectorIdx = Math.floor(normalizedAngle / arcSize);
    if (activeSectorIdx !== lastSectorIndexRef.current && activeSectorIdx >= 0 && activeSectorIdx < numSegments) {
      lastSectorIndexRef.current = activeSectorIdx;
      soundEngine.playSpinTick(520 + activeSectorIdx * 120);
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

    // Pointer is at Top (3 * PI / 2)
    const targetSectorCenter = targetIndex * arcSize + arcSize / 2;
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 to 8 rotations
    const targetFinalAngle = (3 * Math.PI / 2) - targetSectorCenter + (fullSpins * 2 * Math.PI);

    const startAngle = rotationRef.current % (2 * Math.PI);
    const totalDelta = targetFinalAngle - startAngle;
    const durationMs = 4200;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      
      // Quartic Ease-Out for smooth cinematic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
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
      <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_0_18px_rgba(0,240,255,1)]">
        <div 
          className="w-8 h-10 bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-500 shadow-2xl border-t border-cyan-200" 
          style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} 
        />
      </div>

      {/* Enlarged Wheel Canvas Container */}
      <div className="relative p-4 sm:p-5 rounded-full bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-black/80 border-2 border-cyan-500/40 backdrop-blur-xl shadow-[0_0_60px_rgba(0,240,255,0.25)]">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px] cursor-pointer max-w-full rounded-full transition-transform active:scale-[0.99]"
          onClick={() => !disabled && !isSpinning && spin(targetResult)}
        />
      </div>

      {/* Spin Button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={() => spin(targetResult)}
          disabled={disabled || isSpinning}
          className={`cyber-btn px-10 py-4 rounded-2xl font-display font-black text-xl uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
            disabled
              ? 'bg-gray-800/80 text-gray-500 border border-gray-700 cursor-not-allowed'
              : isSpinning
              ? 'bg-cyan-950/80 text-cyan-300 border-2 border-cyan-400 animate-pulse cursor-wait shadow-[0_0_30px_rgba(0,240,255,0.6)]'
              : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_35px_rgba(0,240,255,0.6)] active:scale-95'
          }`}
        >
          <Sparkles className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'SPINNING SECTOR...' : disabled ? 'SPIN LOCKED BY HOST' : 'SPIN THE WHEEL'}</span>
        </button>

        {selectedSegment && (
          <div className="mt-2 px-5 py-2 rounded-xl border border-cyan-500/50 bg-cyan-950/60 text-cyan-300 text-sm font-semibold tracking-wide animate-fade-in flex items-center gap-2 shadow-lg">
            <span>Allotted:</span>
            <span className="font-bold text-white font-display text-lg" style={{ color: selectedSegment.color }}>
              GENRE {selectedSegment.id} — {selectedSegment.name} ({selectedSegment.sub})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
