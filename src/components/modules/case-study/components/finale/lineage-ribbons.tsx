import { cn } from '@/lib/utils';

// An abstract, kinetic echo of the prevalence chart: stacked colour ribbons
// drift left, each at its own speed, so waves appear to overtake one another.
// Each ribbon path spans two periods (0..680 over a 340-wide viewBox) so a
// translate of -340 loops seamlessly.
const RIBBONS = [
  { fill: 'fill-chart-1', y: 30, amp: 14, duration: 9 },
  { fill: 'fill-chart-2', y: 70, amp: 18, duration: 12 },
  { fill: 'fill-chart-3', y: 110, amp: 12, duration: 8 },
  { fill: 'fill-chart-4', y: 150, amp: 20, duration: 14 },
  { fill: 'fill-chart-5', y: 190, amp: 15, duration: 10 },
];

// Build a filled wavy band: a sine top edge across two periods, closed to the bottom.
const ribbonPath = (baseY: number, amp: number, height: number) => {
  const points: string[] = [];
  for (let x = 0; x <= 680; x += 20) {
    const y = baseY + Math.sin((x / 340) * Math.PI * 2) * amp;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M0,${baseY} L${points.join(' L')} L680,${baseY + height} L0,${baseY + height} Z`;
};

export const LineageRibbons = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 340 240"
    className={cn('h-full w-full', className)}
    role="img"
    aria-label="Animated stacked ribbons flowing sideways, echoing the lineage prevalence chart."
  >
    <style>{`
      .gv-ribbon { animation: gv-ribbon-flow linear infinite; }
      @keyframes gv-ribbon-flow { from { transform: translateX(0); } to { transform: translateX(-340px); } }
      @media (prefers-reduced-motion: reduce) { .gv-ribbon { animation: none; } }
    `}</style>

    {RIBBONS.map((ribbon) => (
      <path
        key={ribbon.fill}
        d={ribbonPath(ribbon.y, ribbon.amp, 70)}
        className={cn('gv-ribbon', ribbon.fill)}
        opacity={0.85}
        style={{ animationDuration: `${ribbon.duration}s` }}
      />
    ))}
  </svg>
);

export default LineageRibbons;
