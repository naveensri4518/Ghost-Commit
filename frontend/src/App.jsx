import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RepoInput from './components/RepoInput';
import ScanningState from './components/ScanningState';
import RepoOverview from './components/RepoOverview';
import OpportunityCard from './components/OpportunityCard';
import Toast from './components/Toast';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  ArrowLeft 
} from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeUrl, setActiveUrl] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.warn('Backend or Ollama not reachable yet:', e);
      setHealth({ status: 'degraded', model_available: false, ollama_model: 'qwen2.5:3b' });
    }
  };

  const handleAnalyze = async (url) => {
    setIsLoading(true);
    setError(null);
    setActiveUrl(url);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Analysis failed with status ${response.status}`);
      }

      setRepoData(data);
      setToastMessage('Analysis completed successfully!');
    } catch (err) {
      console.error('Analysis error:', err);
      const errMsg = err.message || 'An unexpected error occurred during repository analysis.';
      setError(errMsg);
      setToastMessage({ text: errMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRepoData(null);
    setError(null);
    setActiveUrl('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col relative selection:bg-purple-600/30 selection:text-purple-200">
      {/* Ambient background glows */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-100px] w-[500px] h-[300px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Navigation */}
      <Navbar health={health} onReset={handleReset} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Error notification banner */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-2xl border border-red-500/30 bg-red-950/20 text-red-200 flex items-start gap-3 backdrop-blur-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-300">Analysis Failed</h4>
              <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{error}</p>
              <button
                onClick={() => handleAnalyze(activeUrl)}
                className="mt-3 px-3 py-1 rounded-lg text-xs bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors cursor-pointer"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        )}

        {/* View Mode 1: Search Form (when idle) */}
        {!repoData && !isLoading && (
          <div className="space-y-12">
            <RepoInput onSubmit={handleAnalyze} isLoading={isLoading} initialValue={activeUrl} />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 border-t border-white/[0.06]">
              <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Terminal className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-100">Grounded in Real Code</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Inspects actual repository file trees, READMEs, entry points, and manifest configs to suggest viable products.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-100">Private Local Ollama</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Leverages your local <span className="font-mono text-purple-300">qwen2.5:3b</span> model. Code snippets are never sent to external AI vendors.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-100">Actionable Blueprints</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Includes MVP execution steps, target personas, codebase leverage points, and unvalidated pricing hypotheses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Scanning / Loading */}
        {isLoading && <ScanningState repoUrl={activeUrl} />}

        {/* View Mode 3: Analysis Results */}
        {repoData && !isLoading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Repository Overview Section */}
            <RepoOverview
              overview={repoData.repo_overview}
              onScanAnother={handleReset}
            />

            {/* Opportunities Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>AI Business Synthesis</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
                  3 Monetizable Product Opportunities
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Grounded in existing algorithms, architecture, and technology of <span className="text-purple-300 font-mono font-medium">{repoData.repo_overview.name}</span>
                </p>
              </div>

              <button
                onClick={handleReset}
                className="self-start sm:self-auto text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 py-2 px-3 rounded-lg border border-white/[0.08] hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>New Repository</span>
              </button>
            </div>

            {/* 3 Opportunity Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {repoData.opportunities.map((opp, idx) => (
                <OpportunityCard
                  key={idx}
                  opportunity={opp}
                  index={idx}
                  repoName={repoData.repo_overview.name}
                  onCopyToast={(msg) => setToastMessage(msg)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 mt-12 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">CommitGhost</span>
            <span>&bull;</span>
            <span>Your Unfinished Code. Your Next Business.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Local AI &bull; Ollama qwen2.5:3b
            </span>
            <span>&bull;</span>
            <span>FastAPI + React Vite</span>
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type="success"
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
