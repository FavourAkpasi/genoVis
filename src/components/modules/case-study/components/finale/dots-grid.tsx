import { cn } from '@/lib/utils';

// Scattered data points drift together into a neat filter grid, hold, then
// scatter again — a metaphor for "now go slice it yourself" in the Explorer.
const COLS = 6;
const ROWS = 4;
const FILLS = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5'];

// Deterministic pseudo-random offset so the scatter is stable across renders.
const pseudo = (seed: number) => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value); // 0..1
};

const DOTS = Array.from({ length: COLS * ROWS }, (_, index) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    gx: 40 + col * 44,
    gy: 40 + row * 50,
    dx: (pseudo(index + 1) - 0.5) * 150,
    dy: (pseudo(index + 7) - 0.5) * 130,
    fill: FILLS[index % FILLS.length],
    delay: pseudo(index + 3) * -6, // negative delay = desynced phases
  };
});

export const DotsGrid = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 300 240"
    className={cn('h-full w-full', className)}
    role="img"
    aria-label="Animated data points that gather into a grid and scatter again."
  >
    <style>{`
      .gv-dot { animation: gv-dot-gather 7s ease-in-out infinite; }
      @keyframes gv-dot-gather {
        0%   { transform: translate(var(--dx), var(--dy)); opacity: 0.35; }
        40%  { transform: translate(0, 0); opacity: 1; }
        70%  { transform: translate(0, 0); opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)); opacity: 0.35; }
      }
      @media (prefers-reduced-motion: reduce) {
        .gv-dot { animation: none; transform: translate(0, 0); opacity: 1; }
      }
    `}</style>

    {DOTS.map((dot) => (
      <circle
        key={`${dot.gx}-${dot.gy}`}
        cx={dot.gx}
        cy={dot.gy}
        r={5}
        className={cn('gv-dot', dot.fill)}
        style={
          {
            '--dx': `${dot.dx.toFixed(1)}px`,
            '--dy': `${dot.dy.toFixed(1)}px`,
            animationDelay: `${dot.delay.toFixed(2)}s`,
          } as React.CSSProperties
        }
      />
    ))}
  </svg>
);

export default DotsGrid;
