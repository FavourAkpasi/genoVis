import { IconArrowRight, IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { SceneStep } from '@/components/modules/case-study/components/scene-step';
import { StoryGraphic } from '@/components/modules/case-study/components/story-graphic';
import { useActiveScene } from '@/components/modules/case-study/hooks/useActiveScene';
import { STORY } from '@/components/modules/case-study/story';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

export const CaseStudyView = () => {
  const { activeIndex, register } = useActiveScene(STORY.length);
  const activeScene = STORY[activeIndex];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex max-w-2xl flex-col gap-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Case study · Guided narrative
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Tracing a variant’s rise and fall
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          In late 2021 a new lineage rewrote the pandemic in about ten weeks. Here is that handover, read live from ~9.4
          million sequenced genomes — the same data the Explorer opens up, walked one step at a time.
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconChevronDown className="size-4 motion-safe:animate-bounce" aria-hidden />
          Scroll to begin
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-16">
        {/* Sticky graphic — the pinned visual updates as the prose scrolls past (lg+ only). */}
        <div className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <div key={activeScene.id} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
              <StoryGraphic scene={activeScene} />
            </div>
            <ol className="flex items-center gap-2" aria-label="Story progress">
              {STORY.map((scene, index) => (
                <li key={scene.id}>
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
          </div>
        </div>

        {/* Scrolling prose column. */}
        <div className="flex flex-col">
          {STORY.map((scene, index) => (
            <SceneStep key={scene.id} scene={scene} index={index} active={index === activeIndex} register={register} />
          ))}
        </div>
      </div>

      <section className="mt-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:mt-16 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Your turn</h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          This was one path through the data. The Explorer lets you slice it by lineage, country and date range, and
          watch every chart respond live — the same components you just scrolled through, with the controls in your
          hands.
        </p>
        <Link to={routes.explorer} className={cn(buttonVariants(), 'gap-2')}>
          Open the Explorer
          <IconArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
};

export default CaseStudyView;
