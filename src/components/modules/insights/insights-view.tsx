import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const InsightsView = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 sm:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          The thinking behind GenoVis — why it is built the way it is. This page will grow into a walkthrough of the
          exploration and the case study.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>What is GenoVis?</CardTitle>
          <CardDescription>A high-performance genomic-mutation visualization dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          GenoVis connects directly to the open cov-spectrum LAPIS API (~9.4M SARS-CoV-2 samples) and turns large, live
          genomic data into fast, interactive visuals — designed to stay smooth even at scale.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two surfaces</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Explorer</span> — the general-purpose engine: filter by
            lineage, country, and date range and watch every view respond live.
          </p>
          <p>
            <span className="font-medium text-foreground">Case Study</span> — a curated, focused story built from the
            same components, with preset state and annotation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Under the hood</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          React 19 · TypeScript · Rspack · TanStack Query · Zustand · Base UI (shadcn base-luma) · custom Canvas and DOM
          virtualization for performance · Web Workers for off-main-thread processing.
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        More to come here — the exploration walkthrough and the case-study narrative, in depth.
      </p>
    </div>
  );
};

export default InsightsView;
