import type { DateRange } from 'react-day-picker';

import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import { CustomSelect } from '@/components/ui/custom-select';
import { useExplorerStore } from '@/store/explorerStore';

const LINEAGE_OPTION_LIMIT = 300;

const toISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fromISO = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    {children}
  </label>
);

export const FilterBar = () => {
  const filters = useExplorerStore((state) => state.filters);
  const setFilter = useExplorerStore((state) => state.setFilter);
  const reset = useExplorerStore((state) => state.reset);

  const countriesQuery = useAggregated({ fields: ['country'] });
  const countries = (countriesQuery.data ?? [])
    .map((row) => String(row.country ?? ''))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const lineagesQuery = useAggregated({ fields: ['pangoLineage'] });
  const lineages = (lineagesQuery.data ?? [])
    .filter((row) => row.pangoLineage)
    .sort((a, b) => b.count - a.count)
    .slice(0, LINEAGE_OPTION_LIMIT)
    .map((row) => String(row.pangoLineage));

  const from = fromISO(filters.dateFrom);
  const dateRange: DateRange | undefined = from ? { from, to: fromISO(filters.dateTo) } : undefined;

  const handleDateChange = (range: DateRange | undefined) => {
    setFilter('dateFrom', range?.from ? toISO(range.from) : '');
    setFilter('dateTo', range?.to ? toISO(range.to) : '');
  };

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3">
        <Field label="Lineage">
          <CustomSelect
            className="w-44"
            label="Lineage"
            placeholder="All lineages"
            items={lineages}
            value={filters.lineage || null}
            onValueChange={(value) => setFilter('lineage', value ?? '')}
          />
        </Field>

        <Field label="Countries">
          <CustomSelect
            multiple
            className="w-64"
            label="Countries"
            placeholder="All countries"
            items={countries}
            value={filters.countries}
            onValueChange={(value) => setFilter('countries', value)}
          />
        </Field>

        <Field label="Date range">
          <CustomDateRangePicker value={dateRange} onValueChange={handleDateChange} />
        </Field>

        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
