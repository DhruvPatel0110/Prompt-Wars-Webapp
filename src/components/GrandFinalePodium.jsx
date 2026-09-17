import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, Sparkles, Download, ArrowLeft, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const GrandFinalePodium = ({ podiumWinners, onBack = null }) => {
  const [selectedWinner, setSelectedWinner] = useState(null);

  const first = podiumWinners?.first;
  const second = podiumWinners?.second;
  const third = podiumWinners?.third;
  const standings = podiumWinners?.fullStandings || [];

  useEffect(() => {
    soundEngine.playVictoryFanfare();

    // Multistage 3D Confetti fireworks
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ffd700', '#00f0ff'] });
    fire(0.2, { spread: 60, colors: ['#ffffff', '#00ff88'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#ff007f', '#ffd700'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#00f0ff', '#8a2be2'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#ffd700', '#ffffff'] });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Grand Title Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-widest animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          OFFICIAL TOURNAMENT PODIUM • PROMPT WARS CHAMPIONSHIP
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-wider drop-shadow-[0_0_25px_rgba(255,215,0,0.5)]">
          GRAND FINALE PODIUM
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Honoring the supreme prompt engineers who conquered all 3 rounds of intense AI competition.
        </p>
      </div>

      {/* 3-Tier Podium Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 max-w-4xl mx-auto">
        {/* 2nd Place (Silver - Left) */}
        {second && (
          <div
            onClick={() => setSelectedWinner(second)}
            className="cyber-card p-6 rounded-3xl border-slate-400/50 bg-gradient-to-t from-slate-950/60 to-[#0d1424] text-center cursor-pointer hover:scale-[1.03] transition-all flex flex-col items-center justify-between order-2 md:order-1 h-80"
          >
            <div className="w-16 h-16 rounded-full bg-slate-400/20 border-2 border-slate-300 text-slate-200 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(203,213,225,0.4)]">
              🥈
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                FIRST RUNNER-UP
              </span>
              <h3 className="font-display font-extrabold text-xl text-white mt-0.5">
                {second.name}
              </h3>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{second.id}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1f2b48] w-full">
              <div className="text-[11px] font-mono uppercase text-gray-400">Final Score</div>
              <div className="font-display font-black text-3xl text-slate-200">
                {second.round3?.evaluation?.total_score || 0}
                <span className="text-sm text-gray-500 font-normal"> / 50</span>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Gold Champion - Center Elevated) */}
        {first && (
          <div
            onClick={() => setSelectedWinner(first)}
            className="cyber-card cyber-card-glow-green p-8 rounded-3xl border-amber-400 bg-gradient-to-t from-amber-950/70 via-[#0d1424] to-amber-950/40 text-center cursor-pointer hover:scale-[1.04] transition-all flex flex-col items-center justify-between order-1 md:order-2 h-96 shadow-[0_0_40px_rgba(255,215,0,0.35)] relative"
          >
            <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-display font-black text-xs uppercase tracking-widest shadow-lg">
              🏆 TOURNAMENT CHAMPION
            </div>

            <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-400 text-amber-300 flex items-center justify-center text-5xl shadow-[0_0_35px_rgba(255,215,0,0.6)] animate-bounce mt-2">
              🥇
            </div>

            <div className="mt-4">
              <span className="text-xs font-mono font-black uppercase text-amber-300 tracking-widest">
                PROMPT WARS 2026 CHAMPION
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1 drop-shadow">
                {first.name}
              </h2>
              <div className="text-xs text-amber-400/80 font-mono mt-0.5">{first.id}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-500/40 w-full">
              <div className="text-xs font-mono uppercase text-gray-400">Winning Score</div>
              <div className="font-display font-black text-4xl text-amber-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                {first.round3?.evaluation?.total_score || 0}
                <span className="text-lg text-gray-400 font-normal"> / 50</span>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze - Right) */}
        {third && (
          <div
            onClick={() => setSelectedWinner(third)}
            className="cyber-card p-6 rounded-3xl border-amber-700/50 bg-gradient-to-t from-amber-950/40 to-[#0d1424] text-center cursor-pointer hover:scale-[1.03] transition-all flex flex-col items-center justify-between order-3 md:order-3 h-72"
          >
            <div className="w-14 h-14 rounded-full bg-amber-800/20 border-2 border-amber-600 text-amber-500 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(217,119,6,0.3)]">
              🥉
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-mono font-bold uppercase text-amber-500 tracking-wider">
                SECOND RUNNER-UP
              </span>
              <h3 className="font-display font-extrabold text-lg text-white mt-0.5">
                {third.name}
              </h3>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{third.id}</div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1f2b48] w-full">
              <div className="text-[11px] font-mono uppercase text-gray-400">Final Score</div>
              <div className="font-display font-black text-2xl text-amber-500">
                {third.round3?.evaluation?.total_score || 0}
                <span className="text-xs text-gray-500 font-normal"> / 50</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Standings Table */}
      <div className="cyber-card p-6 rounded-2xl border-[#1f2b48] mt-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2b48] mb-4">
          <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            FINAL TOURNAMENT STANDINGS
          </h3>

          <a
            href="/api/export/csv"
            download
            className="px-4 py-2 rounded-xl bg-[#070a13] border border-[#1f2b48] hover:border-emerald-500/50 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT ALL RESULTS (CSV)</span>
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f2b48] text-xs font-mono uppercase text-gray-400">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-3 text-center">R1 Score (/20)</th>
                <th className="py-2.5 px-3 text-center">R2 Score (/40)</th>
                <th className="py-2.5 px-3 text-center">R3 Score (/50)</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2b48]/60 text-sm font-sans">
              {standings.map((team, idx) => (
                <tr key={team.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {team.name} <span className="text-xs text-gray-500 font-mono">({team.id})</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-cyan-300">
                    {team.evaluation?.total_score ?? '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-purple-300">
                    {team.round2?.totalScore ?? '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-display font-black text-amber-400">
                    {team.round3?.evaluation?.total_score ?? '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {idx === 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🏆 CHAMPION
                      </span>
                    ) : idx < 3 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        RUNNER UP
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                        FINALIST
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedWinner(team)}
                      className="p-1 rounded-lg bg-[#070a13] border border-[#1f2b48] text-gray-400 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Winner Detail Modal */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-amber-500/40">
            <div className="flex items-center justify-between border-b border-[#1f2b48] pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-white">
                  {selectedWinner.name}
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  {selectedWinner.id} • Rank #{selectedWinner.round3?.finalRank || 1}
                </p>
              </div>
              <button
                onClick={() => setSelectedWinner(null)}
                className="text-gray-400 hover:text-white text-xl font-bold px-3 py-1 rounded-lg bg-[#070a13] border border-[#1f2b48]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Score Breakdown (50 pts) */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-lg text-amber-300">
                    Grand Finale Evaluation (50 Points Total)
                  </span>
                  <span className="font-display font-black text-3xl text-amber-400">
                    {selectedWinner.round3?.evaluation?.total_score || 0} / 50
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#070a13] border border-[#1f2b48]">
                    <div className="text-cyan-400 font-bold mb-1">Part 1: Master Prompt Strategy</div>
                    <div className="text-lg font-bold text-white">
                      {selectedWinner.round3?.evaluation?.master_subtotal || 0} / 30
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070a13] border border-[#1f2b48]">
                    <div className="text-red-400 font-bold mb-1">Part 2: Bomb Adaptation</div>
                    <div className="text-lg font-bold text-white">
                      {selectedWinner.round3?.evaluation?.bomb_subtotal || 0} / 20
                    </div>
                  </div>
                </div>

                {selectedWinner.round3?.evaluation?.verdict_summary && (
                  <p className="text-xs text-gray-300 italic pt-2 border-t border-[#1f2b48]">
                    "{selectedWinner.round3?.evaluation?.verdict_summary}"
                  </p>
                )}
              </div>

              {/* Master Prompt */}
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400">Phase 1 Master Prompt:</span>
                <div className="mt-1 p-3.5 rounded-lg bg-[#070a13] border border-[#1f2b48] font-mono text-xs text-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedWinner.round3?.masterPrompt || "—"}
                </div>
              </div>

              {/* Adapted Prompt */}
              <div>
                <span className="text-xs font-mono uppercase text-red-400">Phase 2 Adapted Prompt (Post-Bomb):</span>
                <div className="mt-1 p-3.5 rounded-lg bg-[#070a13] border border-red-500/30 font-mono text-xs text-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedWinner.round3?.adaptedPrompt || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
