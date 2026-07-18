import { cn } from '@/lib/utils';

// A stylised SARS-CoV-2 virion: a body ringed by spike proteins. The whole
// particle rotates slowly; the spike caps pulse in staggered waves.
const CENTER = 130;
const BODY_R = 46;
const SPIKE_INNER = 48;
const SPIKE_OUTER = 74;
const SPIKE_COUNT = 16;

const SPIKES = Array.from({ length: SPIKE_COUNT }, (_, index) => {
  const angle = (index / SPIKE_COUNT) * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: CENTER + cos * SPIKE_INNER,
    y1: CENTER + sin * SPIKE_INNER,
    x2: CENTER + cos * SPIKE_OUTER,
    y2: CENTER + sin * SPIKE_OUTER,
    delay: (index / SPIKE_COUNT) * 2.4,
  };
});

export const SpikeVirion = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 260 260"
    className={cn('h-full w-full', className)}
    role="img"
    aria-label="An animated, slowly rotating SARS-CoV-2 virion with pulsing spike proteins."
  >
    <style>{`
      .gv-virion { transform-box: view-box; transform-origin: 130px 130px; animation: gv-virion-spin 34s linear infinite; }
      .gv-virion-body { transform-box: view-box; transform-origin: 130px 130px; animation: gv-virion-breathe 5s ease-in-out infinite; }
      .gv-virion-cap { animation: gv-virion-pulse 2.6s ease-in-out infinite; }
      @keyframes gv-virion-spin { to { transform: rotate(360deg); } }
      @keyframes gv-virion-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
      @keyframes gv-virion-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .gv-virion, .gv-virion-body, .gv-virion-cap { animation: none; opacity: 1; }
      }
    `}</style>

    <g className="gv-virion">
      {SPIKES.map((spike) => (
        <g key={`${spike.x2}-${spike.y2}`}>
          <line
            x1={spike.x1}
            y1={spike.y1}
            x2={spike.x2}
            y2={spike.y2}
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-chart-3/70"
          />
          <circle
            cx={spike.x2}
            cy={spike.y2}
            r={6}
            className="gv-virion-cap fill-chart-3"
            style={{ animationDelay: `${spike.delay}s` }}
          />
        </g>
      ))}
    </g>

    <circle cx={CENTER} cy={CENTER} r={BODY_R} className="gv-virion-body fill-muted stroke-chart-3/30" strokeWidth={2} />
    <circle cx={CENTER} cy={CENTER} r={BODY_R * 0.55} className="fill-chart-3/10" />
  </svg>
);

export default SpikeVirion;
