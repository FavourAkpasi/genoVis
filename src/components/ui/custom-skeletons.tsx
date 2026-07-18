import { Skeleton } from '@/components/ui/skeleton';

// Shared loading placeholders, shaped to hint at the content they stand in for.

/** Placeholder for a single large stat number (e.g. "Matching samples"). */
export const StatSkeleton = () => <Skeleton className="mt-1 h-9 w-32 rounded-lg" />;

const BAR_HEIGHTS = [40, 55, 48, 70, 62, 80, 72, 90, 84, 76, 88, 68, 60, 52, 58, 46, 50, 42, 38, 44, 54, 64];

/** Placeholder for the time-series / distribution chart — a soft bar silhouette. */
export const DistributionPlotSkeleton = () => (
  <div className="flex h-[280px] w-full items-end gap-1.5">
    {BAR_HEIGHTS.map((height, index) => (
      <Skeleton key={index} className="flex-1 rounded-md" style={{ height: `${height}%` }} />
    ))}
  </div>
);

// Dot vertical positions per gene-like column (mirrors the real scatter's layout).
const SCATTER_COLUMNS = [
  [20, 45, 70],
  [30, 55],
  [15, 40, 60, 85],
  [50, 75],
  [25, 65],
  [35, 55, 80],
  [45],
  [20, 60, 90],
  [30, 70],
  [40, 55, 78],
];

/** Placeholder for the mutation scatter — scattered dots across columns. */
export const ScatterPlotSkeleton = () => (
  <div className="flex h-[360px] w-full gap-2 pb-8">
    {SCATTER_COLUMNS.map((dots, columnIndex) => (
      <div key={columnIndex} className="relative flex-1">
        {dots.map((top, dotIndex) => (
          <Skeleton
            key={dotIndex}
            className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full"
            style={{ top: `${top}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Placeholder for a data table — a stack of full-width row bars. */
export const TableSkeleton = ({ rows = 10 }: { rows?: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-8 w-full rounded-md" />
    ))}
  </div>
);
