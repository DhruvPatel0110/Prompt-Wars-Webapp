import React, { useState } from 'react';
import { Zap, Volume2, VolumeX, Wifi, WifiOff, LogOut, ShieldAlert, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { TimerDisplay } from './TimerDisplay';
import { soundEngine } from '../utils/audio';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected, latency, serverTimer } = useSocket();
  const [audioEnabled, setAudioEnabled] = useState(true);

  const toggleSound = () => {
    const next = soundEngine.toggle();
    setAudioEnabled(next);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f2b48]/80 bg-[#070a13]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Round Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <div className="w-full h-full bg-[#070a13] rounded-[7px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl tracking-wider text-white">
                  PROMPT<span className="text-cyan-400">WARS</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  2026
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#1f2b48]">
            <span className="px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              ROUND 1: PROMPT MAKEOVER
            </span>
          </div>
        </div>

        {/* Center: Synced Timer */}
        <div className="flex items-center justify-center">
          <TimerDisplay
            timerRemaining={serverTimer.timerRemaining}
            timerRunning={serverTimer.timerRunning}
            timerEndsAt={serverTimer.timerEndsAt}
            size="md"
          />
        </div>

        {/* Right: Controls, User Badge, Status */}
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-xs font-mono">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{latency > 0 ? `${latency}ms` : 'LIVE'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-red-400 font-semibold">RECONNECTING</span>
              </>
            )}
          </div>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            title={audioEnabled ? "Mute Audio FX" : "Enable Audio FX"}
            className="p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* User Session Info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                {user.role === 'admin' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 font-bold">HOST CONTROL</span>
                  </>
                ) : user.role === 'projector' ? (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-300 font-bold">STAGE PROJECTOR</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-white truncate max-w-[130px]">
                      {user.teamName || user.teamId}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-[#0d1424] border border-[#1f2b48] hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
