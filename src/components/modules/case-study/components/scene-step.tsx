import { StoryGraphic } from '@/components/modules/case-study/components/story-graphic';
import type { SceneT } from '@/components/modules/case-study/story';
import { cn } from '@/lib/utils';

interface SceneStepProps {
  scene: SceneT;
  index: number;
  active: boolean;
  register: (index: number) => (node: HTMLElement | null) => void;
}

/**
 * One scroll step: the prose column. On large screens the graphic is pinned in
 * the sticky sibling column, so here we only dim the copy when it isn't active.
 * On small screens there is no sticky column, so each step carries its own
 * inline graphic instead.
 */
export const SceneStep = ({ scene, index, active, register }: SceneStepProps) => (
  <section
    ref={register(index)}
    data-scene-index={index}
    aria-current={active ? 'true' : undefined}
    className="flex min-h-[70vh] flex-col justify-center gap-6 py-10"
  >
    <div className={cn('flex flex-col gap-3 transition-opacity duration-500', active ? 'opacity-100' : 'lg:opacity-35')}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{scene.kicker}</span>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{scene.title}</h2>
      {scene.body.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {paragraph}
        </p>
      ))}
    </div>

    <div className="lg:hidden">
      <StoryGraphic scene={scene} />
    </div>
  </section>
);

export default SceneStep;
