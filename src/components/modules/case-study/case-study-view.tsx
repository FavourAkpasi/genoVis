import { IconArrowRight, IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { FinaleGraphic } from '@/components/modules/case-study/components/finale/finale-graphic';
import { StoryGraphic } from '@/components/modules/case-study/components/story-graphic';
import { useActiveScene } from '@/components/modules/case-study/hooks/useActiveScene';
import { FINALE, STORY } from '@/components/modules/case-study/story';
import type { SceneT } from '@/components/modules/case-study/story';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

// A step is either a live-chart scene or the animated finale.
type StepT = { id: string; kind: 'chart'; scene: SceneT } | { id: string; kind: 'finale' };

const STEPS: StepT[] = [
  ...STORY.map((scene): StepT => ({ id: scene.id, kind: 'chart', scene })),
  { id: 'finale', kind: 'finale' },
];

const stepMeta = (step: StepT) => (step.kind === 'finale' ? FINALE : step.scene);

const StageHeader = () => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Case study</span>
    <p className="text-lg font-semibold tracking-tight">Tracing a variant’s rise and fall</p>
  </div>
);

const StepText = ({ step }: { step: StepT }) => {
  const meta = stepMeta(step);
  return (
    <div className="flex max-w-md flex-col gap-3">
      <span className="text-sm font-medium tracking-wider text-muted-foreground uppercase">{meta.kicker}</span>
      <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-3xl">{meta.title}</h2>
      {meta.body.map((paragraph, index) => (
        <p key={index} className="text-xs leading-relaxed text-muted-foreground sm:text-base">
          {paragraph}
        </p>
      ))}
      {step.kind === 'finale' && (
        <Link to={routes.explorer} className={cn(buttonVariants(), 'mt-2 w-fit gap-2')}>
          {FINALE.ctaLabel}
          <IconArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
};

const StepGraphic = ({ step }: { step: StepT }) => {
  if (step.kind === 'finale') {
    return (
      <Card className="border-none shadow-none">
        <CardContent className="flex aspect-4/3 items-center justify-center p-4 sm:p-6">
          <FinaleGraphic />
        </CardContent>
      </Card>
    );
  }
  return <StoryGraphic scene={step.scene} />;
};

const ProgressRail = ({ activeIndex }: { activeIndex: number }) => (
  <ol className="flex items-center justify-center gap-2" aria-label="Story progress">
    {STEPS.map((step, index) => (
      <li key={step.id}>
        <span
          aria-current={index === activeIndex ? 'step' : undefined}
          className={cn(
            'block h-1.5 rounded-full transition-all duration-500',
            index === activeIndex ? 'w-8 bg-foreground' : 'w-4 bg-muted-foreground/30'
          )}
        />
      </li>
    ))}
  </ol>
);

export const CaseStudyView = () => {
  const { activeIndex, register } = useActiveScene(STEPS.length);
  const activeStep = STEPS[activeIndex];

  return (
    <>
      {/* Desktop: pinned stage. The section is tall enough to scroll through;
          the stage stays fixed to the viewport while its content crossfades. */}
      <section className="relative hidden lg:block" style={{ height: `${STEPS.length * 100}vh` }}>
        {/* Zero-layout markers, one per step, drive the active index via IntersectionObserver. */}
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            ref={register(index)}
            data-scene-index={index}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-screen"
            style={{ top: `${index * 100}vh` }}
          />
        ))}

        <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col gap-4 p-8 xl:px-16">
          <StageHeader />
          <div key={activeStep.id} className="grid flex-1 content-center items-center gap-14 md:grid-cols-2">
            <div className="motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              <StepText step={activeStep} />
            </div>
            <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in-0">
              <StepGraphic step={activeStep} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <ProgressRail activeIndex={activeIndex} />
            <span
              className={cn(
                'flex items-center gap-1.5 text-xl text-muted-foreground transition-opacity duration-500',
                activeIndex !== STEPS.length - 1 ? 'opacity-100' : 'opacity-0'
              )}
            >
              <IconChevronDown
                className="size-8 rounded-full border border-muted-foreground p-1 motion-safe:animate-bounce"
                aria-hidden
              />
              Scroll
            </span>
          </div>
        </div>
      </section>

      {/* Mobile: the pinned two-column layout doesn't fit, so fall back to a
          normal vertical stack of the same steps. */}
      <div className="flex flex-col gap-12 px-4 py-8 lg:hidden">
        <StageHeader />
        {STEPS.map((step) => (
          <section key={step.id} className="flex flex-col gap-5">
            <StepText step={step} />
            <StepGraphic step={step} />
          </section>
        ))}
      </div>
    </>
  );
};

export default CaseStudyView;
