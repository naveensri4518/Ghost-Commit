import React from 'react';
import { Ghost, Cpu, Sparkles, RefreshCw } from 'lucide-react';

export default function Navbar({ health, onReset }) {
  const isHealthy = health?.status === 'healthy' && health?.model_available;
  const isConnecting = !health;

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#050505]/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onReset} 
          className="flex items-center gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-500/40 group-hover:bg-purple-500/15 transition-all duration-200">
            <Ghost className="w-5 h-5 text-purple-400 group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#FAFAFA]">
                CommitGhost
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-300 bg-purple-500/10">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block tracking-wide">
              Your Unfinished Code. Your Next Business.
            </p>
          </div>
        </div>

        {/* Right side engine status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-zinc-400 hidden sm:inline">Engine:</span>
            <span className="font-mono text-zinc-200 font-medium">
              {health?.ollama_model || 'qwen2.5:3b'}
            </span>
            <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/[0.1]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnecting
                    ? 'bg-amber-400 animate-pulse'
                    : isHealthy
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-[11px] text-zinc-300 font-mono">
                {isConnecting ? 'Checking...' : isHealthy ? 'Local AI Ready' : 'Offline'}
              </span>
            </div>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
              title="Reset view"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
