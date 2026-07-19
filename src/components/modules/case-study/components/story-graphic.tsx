import { KpiRow } from '@/components/modules/explorer/components/kpi-row';
import { LineageOverTime } from '@/components/modules/explorer/components/lineage-over-time';
import { MutationScatter } from '@/components/modules/explorer/components/mutation-scatter';
import type { SceneT } from '@/components/modules/case-study/story';

interface StoryGraphicProps {
  scene: SceneT;
}

/**
 * Renders a scene's chart by reusing the Explorer's exact components — the same
 * prop-driven, self-fetching pieces the dashboard uses, here with preset params.
 * One source of truth for every visualisation; the case study is just a curated
 * path through it.
 */
export const StoryGraphic = ({ scene }: StoryGraphicProps) => {
  if (scene.chart === 'lineage-over-time') {
    return <LineageOverTime params={scene.params} activeLineage={scene.activeLineage} />;
  }
  if (scene.chart === 'mutation-scatter') {
    return <MutationScatter params={scene.params} />;
  }
  return <KpiRow params={scene.params} />;
};

export default StoryGraphic;
