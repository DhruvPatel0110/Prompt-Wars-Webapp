import React, { useState } from 'react';
import { Trophy, Medal, Award, CheckCircle2, XCircle, Eye, Search, Sparkles } from 'lucide-react';

export const Leaderboard = ({
  teams = [],
  eliminationPercentage = 50,
  showFullDetails = true,
  onInspectTeam = null
}) => {
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);

  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = a.evaluation?.total_score ?? -1;
    const scoreB = b.evaluation?.total_score ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.timerUsedSeconds || 9999) - (b.timerUsedSeconds || 9999);
  });

  const activeTeams = sortedTeams.filter(t => t.submittedPrompt || t.submissionStatus !== 'idle');
  const cutoffIndex = Math.max(1, Math.ceil(sortedTeams.length * ((100 - eliminationPercentage) / 100)));

  const filteredTeams = sortedTeams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    (t.assignedGenre?.name && t.assignedGenre.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-wider">
            ROUND 1 LEADERBOARD & VERDICTS
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
            {sortedTeams.length} TEAMS
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0d1424] border border-[#1f2b48] text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1f2b48] bg-[#0d1424]/80 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1f2b48] bg-[#070a13]/80 text-xs font-mono uppercase tracking-wider text-gray-400">
              <th className="py-3.5 px-4">Rank</th>
              <th className="py-3.5 px-4">Team</th>
              <th className="py-3.5 px-3">Genre</th>
              <th className="py-3.5 px-3 text-center">Score (/20)</th>
              <th className="py-3.5 px-3 text-center hidden md:table-cell">Breakdown</th>
              <th className="py-3.5 px-3 text-center hidden sm:table-cell">Time Used</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b48]/60 text-sm font-sans">
            {filteredTeams.map((team, idx) => {
              const actualRank = sortedTeams.findIndex(t => t.id === team.id) + 1;
              const isQualified = actualRank <= cutoffIndex && (team.evaluation?.total_score > 0 || team.submittedPrompt);
              const isCutoffRow = actualRank === cutoffIndex && idx !== filteredTeams.length - 1;

              return (
                <React.Fragment key={team.id}>
                  <tr
                    className={`transition-colors hover:bg-cyan-950/20 ${
                      isQualified
                        ? 'bg-emerald-950/10'
                        : 'bg-red-950/5 opacity-80'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {actualRank === 1 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(255,184,0,0.3)]">
                            🥇 1
                          </div>
                        ) : actualRank === 2 ? (
                          <div className="w-7 h-7 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-300 flex items-center justify-center text-sm">
                            🥈 2
                          </div>
                        ) : actualRank === 3 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-600 flex items-center justify-center text-sm">
                            🥉 3
                          </div>
                        ) : (
                          <span className="text-gray-400 pl-2">#{actualRank}</span>
                        )}
                      </div>
                    </td>

                    {/* Team Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white tracking-wide flex items-center gap-2">
                        <span>{team.name}</span>
                        {team.connected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{team.id}</div>
                    </td>

                    {/* Genre */}
                    <td className="py-3.5 px-3">
                      {team.assignedGenre ? (
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider"
                          style={{
                            backgroundColor: `${team.assignedGenre.color}22`,
                            color: team.assignedGenre.color,
                            border: `1px solid ${team.assignedGenre.color}44`
                          }}
                        >
                          {team.assignedGenre.name}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3 text-center">
                      {team.evaluation ? (
                        <div className="font-display font-extrabold text-lg text-cyan-300 drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]">
                          {team.evaluation.total_score}
                          <span className="text-xs text-gray-500 font-normal"> /20</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs font-mono">Pending</span>
                      )}
                    </td>

                    {/* Breakdown */}
                    <td className="py-3.5 px-3 text-center hidden md:table-cell">
                      {team.evaluation ? (
                        <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-gray-300">
                          <span title="Clarity (5)" className="px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/20">
                            C:{team.evaluation.clarity_score}
                          </span>
                          <span title="Context (4)" className="px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-500/20">
                            X:{team.evaluation.context_score}
                          </span>
                          <span title="Constraints (4)" className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                            R:{team.evaluation.constraints_score}
                          </span>
                          <span title="Format (3)" className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                            F:{team.evaluation.format_score}
                          </span>
                          <span title="Creativity (4)" className="px-1.5 py-0.5 rounded bg-pink-950/40 border border-pink-500/20">
                            V:{team.evaluation.creativity_score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Time Used */}
                    <td className="py-3.5 px-3 text-center hidden sm:table-cell font-mono text-xs text-gray-400">
                      {team.timerUsedSeconds ? `${Math.floor(team.timerUsedSeconds / 60)}m ${team.timerUsedSeconds % 60}s` : '—'}
                    </td>

                    {/* Status / Verdict */}
                    <td className="py-3.5 px-4 text-center">
                      {isQualified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          QUALIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/40 border border-red-500/30 text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          ELIMINATED
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (onInspectTeam) onInspectTeam(team);
                          else setSelectedTeam(team);
                        }}
                        className="p-1.5 rounded-lg bg-[#070a13] border border-[#1f2b48] hover:border-cyan-500/50 hover:text-cyan-400 text-gray-400 transition-colors"
                        title="View Submission & Reasoning"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Cutoff Indicator Line */}
                  {isCutoffRow && (
                    <tr className="bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20">
                      <td colSpan={8} className="py-2 px-4 text-center font-mono font-bold text-xs text-amber-300 tracking-widest border-y border-amber-500/40 shadow-[0_0_15px_rgba(255,184,0,0.2)]">
                        ⚡ ▲ TOP 50% QUALIFICATION CUTOFF THRESHOLD ({cutoffIndex} TEAMS ADVANCING TO ROUND 2) ▼ ⚡
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-[#1f2b48] pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-2xl text-white">
                  {selectedTeam.name}
                </h3>
                <p className="text-xs text-cyan-400 font-mono">
                  {selectedTeam.id} • Genre: {selectedTeam.assignedGenre?.name || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-white text-xl font-bold px-3 py-1 rounded-lg bg-[#070a13] border border-[#1f2b48]"
              >
                ✕
              </button>
            </div>

            {/* Bad Prompt vs Improved */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-red-400">Assigned Bad Prompt:</span>
                <div className="mt-1 p-3 rounded-lg bg-red-950/20 border border-red-500/30 font-mono text-sm text-red-200">
                  {selectedTeam.assignedQuestion?.badPrompt || "—"}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Improved Prompt Submitted:</span>
                <div className="mt-1 p-3.5 rounded-lg bg-[#070a13] border border-cyan-500/30 font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedTeam.submittedPrompt || selectedTeam.draftPrompt || "No submission recorded."}
                </div>
              </div>

              {selectedTeam.evaluation && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-lg text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      AI Evaluator Score
                    </span>
                    <span className="font-display font-black text-2xl text-white">
                      {selectedTeam.evaluation.total_score} / 20
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <div className="text-gray-400">Clarity</div>
                      <div className="font-bold text-cyan-400 text-sm">{selectedTeam.evaluation.clarity_score}/5</div>
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <div className="text-gray-400">Context</div>
                      <div className="font-bold text-purple-400 text-sm">{selectedTeam.evaluation.context_score}/4</div>
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <div className="text-gray-400">Constraints</div>
                      <div className="font-bold text-amber-400 text-sm">{selectedTeam.evaluation.constraints_score}/4</div>
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <div className="text-gray-400">Format</div>
                      <div className="font-bold text-emerald-400 text-sm">{selectedTeam.evaluation.format_score}/3</div>
                    </div>
                    <div className="p-2 rounded bg-[#070a13] border border-[#1f2b48]">
                      <div className="text-gray-400">Creativity</div>
                      <div className="font-bold text-pink-400 text-sm">{selectedTeam.evaluation.creativity_score}/4</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 italic pt-2 border-t border-[#1f2b48]">
                    "{selectedTeam.evaluation.reasoning}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
