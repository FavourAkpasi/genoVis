import { FilterBar } from '@/components/modules/explorer/components/filter-bar';
import { KpiRow } from '@/components/modules/explorer/components/kpi-row';
import { LineageBar } from '@/components/modules/explorer/components/lineage-bar';
import { LineageOverTime } from '@/components/modules/explorer/components/lineage-over-time';
import { MutationScatter } from '@/components/modules/explorer/components/mutation-scatter';
import { SampleTable } from '@/components/modules/explorer/components/sample-table';
import { TimeSeries } from '@/components/modules/explorer/components/time-series';
import { filtersToParams, useExplorerStore } from '@/store/explorerStore';

export const ExplorerView = () => {
  const filters = useExplorerStore((state) => state.filters);
  const setFilter = useExplorerStore((state) => state.setFilter);
  const params = filtersToParams(filters);
  // Crossfilter self-exclusion: the lineage charts ignore the lineage filter so they always
  // show the full breakdown (selected one highlighted, rest dimmed) instead of collapsing.
  const lineageAgnosticParams = filtersToParams({ ...filters, lineage: '' });

  // Brushing: clicking a lineage in any chart filters the whole view (toggle off if re-clicked).
  const handleSelectLineage = (lineage: string) => setFilter('lineage', filters.lineage === lineage ? '' : lineage);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground">Live connection to the cov-spectrum LAPIS dataset.</p>
      </header>

      <div className="sticky top-14 z-30">
        <FilterBar />
      </div>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <KpiRow params={params} />

        <div className="grid items-center justify-center gap-4 lg:grid-cols-3">
          <div className="col-span-2">
            <LineageOverTime
              params={lineageAgnosticParams}
              activeLineage={filters.lineage}
              onSelectLineage={handleSelectLineage}
            />
          </div>
          <div className="col-span-1">
            <LineageBar
              params={lineageAgnosticParams}
              activeLineage={filters.lineage}
              onSelectLineage={handleSelectLineage}
            />
          </div>
        </div>
        <TimeSeries params={params} />
        <MutationScatter params={params} />

        <SampleTable params={params} />
      </div>
    </div>
  );
};

export default ExplorerView;
