import { cn } from '@/lib/utils';

// A phylogenetic tree: branches draw themselves outward into labelled lineage
// tips, which then pulse gently. Colours use chart tokens so light/dark just work.
const BRANCHES = [
  { d: 'M24 130 L96 130', delay: 0 },
  { d: 'M96 130 L150 80', delay: 0.35 },
  { d: 'M96 130 L150 186', delay: 0.35 },
  { d: 'M150 80 L250 46', delay: 0.7 },
  { d: 'M150 80 L250 86', delay: 0.85 },
  { d: 'M150 80 L250 124', delay: 1.0 },
  { d: 'M150 186 L250 176', delay: 0.7 },
  { d: 'M150 186 L250 214', delay: 0.85 },
];

const TIPS = [
  { x: 250, y: 46, fill: 'fill-chart-1', label: 'BA.2', delay: 1.3 },
  { x: 250, y: 86, fill: 'fill-chart-2', label: 'BA.1.1', delay: 1.45 },
  { x: 250, y: 124, fill: 'fill-chart-3', label: 'BA.1', delay: 1.6 },
  { x: 250, y: 176, fill: 'fill-chart-4', label: 'AY.4', delay: 1.75 },
  { x: 250, y: 214, fill: 'fill-chart-5', label: 'AY.103', delay: 1.9 },
];

export const PhyloTree = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 340 260"
    className={cn('h-full w-full', className)}
    role="img"
    aria-label="An animated phylogenetic tree branching into the lineages from the story."
  >
    <style>{`
      .gv-phylo-branch { stroke-dasharray: 1; stroke-dashoffset: 1; animation: gv-phylo-draw 0.7s ease-out forwards; }
      .gv-phylo-tip { opacity: 0; transform-box: fill-box; transform-origin: center; animation: gv-phylo-pop 0.5s ease-out forwards, gv-phylo-pulse 2.6s ease-in-out infinite; }
      .gv-phylo-label { opacity: 0; animation: gv-phylo-fade 0.6s ease-out forwards; }
      @keyframes gv-phylo-draw { to { stroke-dashoffset: 0; } }
      @keyframes gv-phylo-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
      @keyframes gv-phylo-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.28); } }
      @keyframes gv-phylo-fade { to { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .gv-phylo-branch, .gv-phylo-tip, .gv-phylo-label { animation: none; opacity: 1; stroke-dashoffset: 0; }
      }
    `}</style>

    {BRANCHES.map((branch) => (
      <path
        key={branch.d}
        d={branch.d}
        pathLength={1}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        className="gv-phylo-branch stroke-muted-foreground/60"
        style={{ animationDelay: `${branch.delay}s` }}
      />
    ))}

    {TIPS.map((tip) => (
      <g key={tip.label}>
        <circle
          cx={tip.x}
          cy={tip.y}
          r={5}
          className={cn('gv-phylo-tip', tip.fill)}
          style={{ animationDelay: `${tip.delay}s, ${tip.delay + 0.5}s` }}
        />
        <text
          x={tip.x + 12}
          y={tip.y}
          dy="0.32em"
          className="gv-phylo-label fill-foreground font-mono text-[11px]"
          style={{ animationDelay: `${tip.delay + 0.1}s` }}
        >
          {tip.label}
        </text>
      </g>
    ))}
  </svg>
);

export default PhyloTree;
