import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Users, 
  AlertCircle, 
  Lightbulb, 
  Code, 
  DollarSign, 
  ListChecks, 
  Gauge,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function OpportunityCard({ opportunity, index, repoName, onCopyToast }) {
  const [copied, setCopied] = useState(false);
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 1:
        return 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10';
      case 2:
        return 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10';
      case 3:
        return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
      case 4:
        return 'border-amber-500/30 text-amber-300 bg-amber-500/10';
      case 5:
        return 'border-rose-500/30 text-rose-300 bg-rose-500/10';
      default:
        return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
    }
  };

  const getDifficultyLabel = (diff) => {
    switch (diff) {
      case 1:
        return 'Trivial Wrap';
      case 2:
        return 'Fast MVP';
      case 3:
        return 'Moderate Build';
      case 4:
        return 'Complex Workflow';
      case 5:
        return 'Heavy Infra';
      default:
        return 'Moderate';
    }
  };

  const handleCopy = async () => {
    const markdownContent = `# Business Opportunity: ${opportunity.product_name}
Source Repository: https://github.com/${repoName}
Generated via: CommitGhost (Local AI qwen2.5:3b)

## 1. Problem Solved
${opportunity.problem_solved}

## 2. Target Customer
${opportunity.target_customer}

## 3. Proposed Solution
${opportunity.proposed_solution}

## 4. How Existing Codebase Accelerates This
${opportunity.how_existing_code_helps}

## 5. Pricing Hypothesis (Unvalidated)
${opportunity.pricing_hypothesis}

## 6. MVP Implementation Plan (Difficulty: ${opportunity.difficulty}/5 - ${getDifficultyLabel(opportunity.difficulty)})
${opportunity.mvp_implementation_plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}
`;

    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      if (onCopyToast) {
        onCopyToast(`Business plan for "${opportunity.product_name}" copied to clipboard!`);
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col justify-between p-6 sm:p-7 relative group hover:border-purple-500/40 transition-all duration-300">
      {/* Top accent badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
              0{index + 1}
            </span>
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono border flex items-center gap-1.5 ${getDifficultyColor(opportunity.difficulty)}`}>
              <Gauge className="w-3 h-3" />
              <span>Diff {opportunity.difficulty}/5 &bull; {getDifficultyLabel(opportunity.difficulty)}</span>
            </div>
          </div>
          
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Copy plan to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Product Title */}
        <h3 className="text-xl font-bold tracking-tight text-[#FAFAFA] group-hover:text-purple-200 transition-colors">
          {opportunity.product_name}
        </h3>

        {/* Target customer */}
        <div className="mt-3 flex items-center gap-2 text-xs text-purple-300/90 font-medium">
          <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>{opportunity.target_customer}</span>
        </div>

        <div className="my-5 border-t border-white/[0.06]" />

        {/* Problem */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            <AlertCircle className="w-3 h-3 text-red-400/80" />
            <span>Problem Solved</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {opportunity.problem_solved}
          </p>
        </div>

        {/* Proposed Solution */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            <Lightbulb className="w-3 h-3 text-amber-400/80" />
            <span>Proposed Solution</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {opportunity.proposed_solution}
          </p>
        </div>

        {/* How existing code helps */}
        <div className="mb-4 p-3 rounded-xl bg-purple-950/25 border border-purple-500/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span>Codebase Leverage</span>
          </div>
          <p className="text-xs text-purple-100/90 leading-relaxed">
            {opportunity.how_existing_code_helps}
          </p>
        </div>

        {/* Pricing Hypothesis */}
        <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pricing Hypothesis</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Hypothesis
            </span>
          </div>
          <p className="text-xs text-zinc-200 font-mono">
            {opportunity.pricing_hypothesis}
          </p>
        </div>

        {/* MVP Implementation Plan */}
        <div>
          <button
            type="button"
            onClick={() => setIsPlanExpanded(!isPlanExpanded)}
            className="w-full flex items-center justify-between gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 hover:text-purple-300 transition-colors cursor-pointer group/plan"
            aria-expanded={isPlanExpanded}
            title={isPlanExpanded ? "Collapse blueprint steps" : "Expand blueprint steps"}
          >
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-purple-400" />
              <span>MVP Implementation Blueprint</span>
              <span className="text-[10px] text-zinc-500 font-mono font-normal lowercase">
                ({opportunity.mvp_implementation_plan.length} steps)
              </span>
            </div>
            {isPlanExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover/plan:text-purple-300 transition-transform" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover/plan:text-purple-300 transition-transform" />
            )}
          </button>

          {isPlanExpanded && (
            <ol className="space-y-1.5 animate-in fade-in duration-200">
              {opportunity.mvp_implementation_plan.map((step, stepIndex) => (
                <li
                  key={stepIndex}
                  className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                >
                  <span className="shrink-0 w-4 h-4 rounded-full bg-white/[0.05] border border-white/[0.1] text-[10px] font-mono text-zinc-400 flex items-center justify-center mt-0.5">
                    {stepIndex + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Card Action */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] text-zinc-500 font-mono">
          Ready for validation
        </span>
        <button
          onClick={handleCopy}
          className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Copy full plan</span>
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
