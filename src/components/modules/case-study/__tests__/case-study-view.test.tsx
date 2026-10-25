import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CaseStudyView } from '@/components/modules/case-study/case-study-view';
import { FINALE, STORY } from '@/components/modules/case-study/story';
import { IntersectionObserverStub } from '@tests/integration/browser-stubs';
import { renderWithProviders } from '@tests/integration/utils';

const markerAt = (index: number) => document.querySelector(`[data-scene-index="${index}"]`) as HTMLElement;

describe('CaseStudyView', () => {
  it('renders every scene in the mobile stack and the first on the pinned stage', async () => {
    renderWithProviders(<CaseStudyView />);
    for (const scene of STORY) {
      expect(screen.getAllByRole('heading', { name: scene.title }).length).toBeGreaterThanOrEqual(1);
    }
    // The first title appears twice: on the desktop stage and in the mobile stack.
    expect(screen.getAllByRole('heading', { name: STORY[0].title })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: FINALE.ctaLabel })[0]).toHaveAttribute('href', '/');
  });

  it('advances the pinned stage as scene markers cross the viewport centre', async () => {
    renderWithProviders(<CaseStudyView />);
    const rail = screen.getByRole('list', { name: 'Story progress' });
    const current = () =>
      within(rail)
        .getAllByRole('listitem')
        .findIndex((item) => item.querySelector('[aria-current="step"]'));
    expect(current()).toBe(0);

    act(() => IntersectionObserverStub.intersect(markerAt(2)));
    expect(current()).toBe(2);
    expect(screen.getAllByRole('heading', { name: STORY[2].title })).toHaveLength(2);

    // Leaving the band does not change the active step.
    act(() => IntersectionObserverStub.intersect(markerAt(3), false));
    expect(current()).toBe(2);

    const last = STORY.length;
    act(() => IntersectionObserverStub.intersect(markerAt(last)));
    expect(current()).toBe(last);
    expect(screen.getAllByRole('heading', { name: FINALE.title })).toHaveLength(2);
  });
});
