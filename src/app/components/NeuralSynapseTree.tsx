"use client";

import React, { useState } from "react";

export interface NeuralBranch {
  id: string;
  label: string;
  trajectory: string;
  implication: string;
}

interface NeuralSynapseTreeProps {
  branches: NeuralBranch[];
  onSelectBranch: (branch: NeuralBranch) => void;
  onPruneBranch: (branch: NeuralBranch) => void;
}

export default function NeuralSynapseTree({
  branches,
  onSelectBranch,
  onPruneBranch,
}: NeuralSynapseTreeProps) {
  const [prunedIds, setPrunedIds] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!branches || branches.length === 0) return null;

  const handlePrune = (branch: NeuralBranch, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrunedIds((prev) => ({ ...prev, [branch.id]: true }));
    onPruneBranch(branch);
  };

  const handleSelect = (branch: NeuralBranch) => {
    if (prunedIds[branch.id]) return;
    setSelectedId(branch.id);
    onSelectBranch(branch);
  };

  return (
    <div className="mt-4 pt-3 border-t border-[#1a2332]/60 font-mono">
      {/* Header / Origin Synapse */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-4 h-4">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
            Neural Decision Tree
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
            {branches.length} VECTORS
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          Клікніть вектор або відсічіть небажаний
        </span>
      </div>

      {/* Synaptic Network Branches */}
      <div className="relative space-y-2.5">
        {/* Decorative Synaptic Spine SVG */}
        <div className="absolute left-3 top-2 bottom-4 w-px bg-gradient-to-b from-cyan-500/50 via-cyan-800/20 to-transparent pointer-events-none" />

        {branches.map((branch, index) => {
          const isPruned = !!prunedIds[branch.id];
          const isSelected = selectedId === branch.id;

          return (
            <div
              key={branch.id || index}
              className={`relative ml-6 rounded-lg p-3 transition-all duration-300 border ${
                isPruned
                  ? "bg-[#140808]/70 border-red-900/40 opacity-70"
                  : isSelected
                  ? "bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-[#0b0f14]/80 hover:bg-[#0e141c] border-[#182330] hover:border-cyan-500/40"
              }`}
            >
              {/* Connector Node */}
              <div
                className={`absolute -left-[19px] top-4 w-2.5 h-2.5 rounded-full border transition-colors ${
                  isPruned
                    ? "bg-red-500 border-red-700 shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                    : isSelected
                    ? "bg-cyan-400 border-white shadow-[0_0_8px_rgba(6,182,212,1)] animate-pulse"
                    : "bg-[#0d1520] border-cyan-600/50"
                }`}
              />

              {/* Branch Header */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isPruned
                        ? "bg-red-950 text-red-400 line-through"
                        : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                    }`}
                  >
                    Вектор 0{index + 1}
                  </span>
                  <h4
                    className={`text-xs font-semibold ${
                      isPruned
                        ? "text-red-400/80 line-through"
                        : "text-gray-200 group-hover:text-cyan-300"
                    }`}
                  >
                    {branch.label}
                  </h4>
                </div>

                {isPruned && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400">
                    🛑 ВІДСІЧЕНО // WALRUS CONSTRAINT
                  </span>
                )}
              </div>

              {/* Trajectory ("Куди це приведе") */}
              <div className="text-[11px] text-gray-400 leading-relaxed mb-1 pl-1 border-l border-cyan-500/20">
                <span className="text-cyan-400/90 font-medium">🔮 Куди приведе: </span>
                <span className={isPruned ? "line-through text-gray-500" : ""}>
                  {branch.trajectory}
                </span>
              </div>

              {/* Implication / Key Trade-off */}
              {branch.implication && (
                <div className="text-[10px] text-gray-500 mb-2 pl-1">
                  <span className="text-gray-400 font-mono">⚡ Ризик / Ціна: </span>
                  <span className={isPruned ? "line-through" : ""}>
                    {branch.implication}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              {!isPruned ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#15202b]">
                  <button
                    onClick={() => handleSelect(branch)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 text-[11px] font-semibold transition-all shadow-sm hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                  >
                    <span>⚡ Обрати вектор</span>
                  </button>

                  <button
                    onClick={(e) => handlePrune(branch, e)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#180f0f] hover:bg-red-950/60 border border-red-900/40 hover:border-red-600 text-red-400 hover:text-red-300 text-[11px] transition-all"
                    title="Відсікти цей сценарій та назавжди записати заборону в пам'ять Walrus"
                  >
                    <span>✂️ Відсікти гілку</span>
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-red-400/80 italic mt-1">
                  ⚠️ Цей вектор заблоковано і додано до ваших активних обмежень.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
