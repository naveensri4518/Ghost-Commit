import React from 'react';
import { Star, GitFork, ExternalLink, RefreshCw, Terminal, Layers, Code2 } from 'lucide-react';

export default function RepoOverview({ overview, onScanAnother }) {
  if (!overview) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-8 border border-white/[0.12] relative overflow-hidden">
      {/* Background ambient corner light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
              {overview.name}
            </h2>
            {overview.repo_url && (
              <a
                href={overview.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-mono hover:underline"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="mt-2 text-sm text-[#A1A1AA] max-w-3xl leading-relaxed">
            {overview.description || 'No description provided.'}
          </p>
        </div>

        <button
          onClick={onScanAnother}
          className="self-start sm:self-center px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Scan Another Repository</span>
        </button>
      </div>

      {/* Quick stats & languages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-300 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span>{overview.stars?.toLocaleString() || 0} stars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="w-4 h-4 text-zinc-400" />
            <span>{overview.forks?.toLocaleString() || 0} forks</span>
          </div>
        </div>

        {/* Primary languages */}
        <div className="sm:col-span-2 flex items-center gap-2 flex-wrap bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium mr-1">
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            Languages:
          </span>
          {overview.primary_languages?.length > 0 ? (
            overview.primary_languages.map((lang) => (
              <span
                key={lang}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/15 border border-purple-500/30 text-purple-200"
              >
                {lang}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-500 font-mono">Not specified</span>
          )}
        </div>
      </div>

      {/* Detected Tech Stack */}
      {overview.key_technologies?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Detected Technologies & Frameworks</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {overview.key_technologies.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.03] border border-white/[0.08] text-zinc-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Codebase functionality summary */}
      <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Core Functionality & Architectural Leverage</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {overview.summary}
        </p>
      </div>
    </div>
  );
}
