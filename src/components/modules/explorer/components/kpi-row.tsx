import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import { useLineageComposition } from '@/components/modules/explorer/hooks/useLineageComposition';
import { useTimeSeries } from '@/components/modules/explorer/hooks/useTimeSeries';
import { Card, CardContent } from '@/components/ui/card';
import { StatSkeleton } from '@/components/ui/custom-skeletons';
import type { QueryParamsT } from '@/lib/endpoints';

const fullNumber = new Intl.NumberFormat('en-US');
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  pending: boolean;
}

const Stat = ({ label, value, sub, pending }: StatProps) => (
  <Card>
    <CardContent>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {pending ? <StatSkeleton /> : <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>}
      {!pending && sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

interface KpiRowProps {
  params?: QueryParamsT;
}

/** Scannable summary of the current selection: total, date span, lineage + country breadth. */
export const KpiRow = ({ params = {} }: KpiRowProps) => {
  const totalQuery = useAggregated(params);
  const datesQuery = useTimeSeries(params);
  const lineagesQuery = useLineageComposition(params);
  const countriesQuery = useAggregated({ ...params, fields: ['country'] });

  const total = totalQuery.data?.[0]?.count ?? 0;

  const dates = (datesQuery.data ?? [])
    .map((row) => String(row.date ?? ''))
    .filter(Boolean)
    .sort();
  const dateSpan = dates.length > 0 ? `${formatDay(dates[0])} – ${formatDay(dates[dates.length - 1])}` : '—';

  const lineageCount = (lineagesQuery.data ?? []).filter((row) => row.pangoLineage).length;
  const countryCount = (countriesQuery.data ?? []).filter((row) => row.country).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="Matching samples" value={fullNumber.format(total)} pending={totalQuery.isPending} />
      <Stat
        label="Collection span"
        value={`${dates.length} ${dates.length === 1 ? 'day' : 'days'}`}
        sub={dateSpan}
        pending={datesQuery.isPending}
      />
      <Stat label="Lineages" value={compactNumber.format(lineageCount)} pending={lineagesQuery.isPending} />
      <Stat label="Countries" value={compactNumber.format(countryCount)} pending={countriesQuery.isPending} />
    </div>
  );
};

export default KpiRow;
