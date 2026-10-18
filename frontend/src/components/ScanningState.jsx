import React, { useEffect, useState } from 'react';
import { GitFork, FileCode, Cpu, Lightbulb, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Fetching repository tree & metadata from GitHub API', icon: GitFork },
  { id: 2, label: 'Inspecting manifests, entry points & architecture', icon: FileCode },
  { id: 3, label: 'Running local inference with Ollama (qwen2.5:3b)', icon: Cpu },
  { id: 4, label: 'Discovering 3 grounded business opportunities', icon: Lightbulb },
];

export default function ScanningState({ repoUrl }) {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    // Progressively highlight steps while waiting for local inference
    const t1 = setTimeout(() => setActiveStep(2), 2200);
    const t2 = setTimeout(() => setActiveStep(3), 5000);
    const t3 = setTimeout(() => setActiveStep(4), 16000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
      <div className="glass-panel rounded-2xl p-8 border border-purple-500/20 text-center relative overflow-hidden shadow-2xl shadow-purple-950/30">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Central Pulse Radar Graphic */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping opacity-25" />
          <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-pulse" />
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center backdrop-blur-md">
            <Cpu className="w-6 h-6 text-purple-400 animate-bounce" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-[#FAFAFA] tracking-tight">
          Deconstructing Repository
        </h3>
        <p className="text-xs text-purple-300 font-mono mt-1 mb-8">
          {repoUrl}
        </p>

        {/* Multi-step progress list */}
        <div className="space-y-3.5 text-left max-w-md mx-auto">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = activeStep > step.id;
            const isCurrent = activeStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'border-purple-500/40 bg-purple-500/10 text-white shadow-md shadow-purple-950/20'
                    : isCompleted
                    ? 'border-white/[0.06] bg-white/[0.01] text-zinc-400'
                    : 'border-white/[0.03] bg-transparent text-zinc-600'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <span className="text-xs font-medium tracking-wide">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-[11px] text-zinc-500 font-mono">
          Local inference runs privately on your GPU/CPU via Ollama.
        </p>
      </div>
    </div>
  );
}
