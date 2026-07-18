import { FilterBar } from '@/components/modules/explorer/components/filter-bar';
import { MutationScatter } from '@/components/modules/explorer/components/mutation-scatter';
import { SampleTable } from '@/components/modules/explorer/components/sample-table';
import { TimeSeries } from '@/components/modules/explorer/components/time-series';
import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatSkeleton } from '@/components/ui/custom-skeletons';
import { filtersToParams, useExplorerStore } from '@/store/explorerStore';

const numberFormatter = new Intl.NumberFormat('en-US');

export const ExplorerView = () => {
  const filters = useExplorerStore((state) => state.filters);
  const params = filtersToParams(filters);

  const totalQuery = useAggregated(params);
  const total = totalQuery.data?.[0]?.count ?? 0;

  const renderTotal = () => {
    if (totalQuery.isPending) return <StatSkeleton />;
    if (totalQuery.isError)
      return <p className="mt-1 text-sm text-destructive">Failed to load: {totalQuery.error.message}</p>;
    return <p className="mt-1 text-3xl font-semibold tabular-nums">{numberFormatter.format(total)}</p>;
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground">Live connection to the cov-spectrum LAPIS dataset.</p>
      </header>

      <div className="sticky top-14 z-30">
        <FilterBar />
      </div>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Matching samples</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">{renderTotal()}</CardContent>
        </Card>

        <TimeSeries params={params} />

        <MutationScatter params={params} />

        <SampleTable params={params} />
      </div>
    </div>
  );
};

export default ExplorerView;
