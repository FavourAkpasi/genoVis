import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';

const numberFormatter = new Intl.NumberFormat('en-US');

const TOP_LINEAGE_LIMIT = 5;

export const ExplorerView = () => {
  const totalQuery = useAggregated();
  const lineageQuery = useAggregated({ fields: ['pangoLineage'] });

  const total = totalQuery.data?.[0]?.count ?? 0;

  const topLineages = (lineageQuery.data ?? [])
    .filter((row) => row.pangoLineage)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_LINEAGE_LIMIT);

  const renderTotal = () => {
    if (totalQuery.isPending) return <p className="mt-1 text-3xl font-semibold">Loading…</p>;
    if (totalQuery.isError)
      return <p className="mt-1 text-sm text-destructive">Failed to load: {totalQuery.error.message}</p>;
    return <p className="mt-1 text-3xl font-semibold tabular-nums">{numberFormatter.format(total)}</p>;
  };

  const renderLineages = () => {
    if (lineageQuery.isPending) return <p className="mt-3 text-sm text-muted-foreground">Loading…</p>;
    if (lineageQuery.isError)
      return <p className="mt-3 text-sm text-destructive">Failed to load: {lineageQuery.error.message}</p>;
    return (
      <ul className="mt-3 flex flex-col gap-2">
        {topLineages.map((row) => (
          <li key={String(row.pangoLineage)} className="flex items-center justify-between text-sm">
            <span className="font-mono">{String(row.pangoLineage)}</span>
            <span className="text-muted-foreground tabular-nums">{numberFormatter.format(row.count)}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground">Live connection to the cov-spectrum LAPIS dataset.</p>
      </header>

      <section className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">Total sequenced samples</p>
        {renderTotal()}
      </section>

      <section className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">Top lineages by sample count</p>
        {renderLineages()}
      </section>
    </div>
  );
};

export default ExplorerView;
