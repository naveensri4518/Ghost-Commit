import React, { useState } from 'react';
import { Search, Sparkles, GitBranch, ArrowRight } from 'lucide-react';

const PRESET_REPOS = [
  { label: 'expressjs/express', desc: 'Node backend' },
  { label: 'pallets/flask', desc: 'Python microframework' },
  { label: 'sindresorhus/got', desc: 'HTTP client' },
  { label: 'shadcn-ui/ui', desc: 'Component library' },
];

export default function RepoInput({ onSubmit, isLoading, initialValue = '' }) {
  const [url, setUrl] = useState(initialValue);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a GitHub repository URL or owner/repo format');
      return;
    }
    setValidationError('');
    onSubmit(trimmed);
  };

  const handleSelectPreset = (repoSlug) => {
    setUrl(repoSlug);
    setValidationError('');
    onSubmit(repoSlug);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      {/* Hero Title */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Powered by Local Ollama &bull; qwen2.5:3b
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FAFAFA] leading-tight">
          Your Unfinished Code.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#C4B5FD] to-indigo-300">
            Your Next Business.
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto leading-relaxed">
          CommitGhost inspects real GitHub architecture, dependencies, and code patterns to extract 3 actionable, monetizable products you can launch.
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="glass-panel rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-2xl shadow-purple-950/20">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3.5 text-zinc-500">
              <Search className="w-5 h-5 text-purple-400/80" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. https://github.com/expressjs/express or owner/repo"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Analyze Codebase</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {validationError && (
          <p className="mt-2 text-xs text-red-400 pl-3">{validationError}</p>
        )}
      </form>

      {/* Preset pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
          <GitBranch className="w-3.5 h-3.5" /> Try sample:
        </span>
        {PRESET_REPOS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSelectPreset(preset.label)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 text-zinc-300 hover:text-purple-200 transition-all cursor-pointer font-mono"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
