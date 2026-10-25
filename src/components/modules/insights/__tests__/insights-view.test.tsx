import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from '@/components/modules/insights/components/code-block';
import { InsightsView } from '@/components/modules/insights/insights-view';
import { IntersectionObserverStub } from '@tests/integration/browser-stubs';
import { renderWithProviders } from '@tests/integration/utils';

describe('InsightsView', () => {
  it('renders every section with a matching table-of-contents link', () => {
    renderWithProviders(<InsightsView />);
    const toc = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(toc).getAllByRole('link');
    expect(links).toHaveLength(6);
    for (const link of links) {
      const id = link.getAttribute('href')?.slice(1) ?? '';
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });

  it('highlights the section being read', () => {
    renderWithProviders(<InsightsView />);
    const toc = screen.getByRole('navigation', { name: 'On this page' });
    const activeHref = () =>
      within(toc)
        .getAllByRole('link')
        .find((link) => link.getAttribute('aria-current'))
        ?.getAttribute('href');
    expect(activeHref()).toBe('#architecture');

    act(() => IntersectionObserverStub.intersect(document.getElementById('worker') as HTMLElement));
    expect(activeHref()).toBe('#worker');
  });

  it('links back to the Explorer and Case Study', () => {
    renderWithProviders(<InsightsView />);
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === '/')).toBe(true);
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === '/case-study')).toBe(true);
  });
});

describe('CodeBlock', () => {
  it('dims trailing comments but leaves URLs intact', () => {
    render(<CodeBlock caption="example.ts" code={"const a = 1; // note\nconst url = 'https://x.y';"} />);
    expect(screen.getByText('example.ts')).toBeInTheDocument();
    expect(screen.getByText('// note')).toHaveClass('text-muted-foreground/60');
    expect(screen.getByText("const url = 'https://x.y';")).toBeInTheDocument();
  });
});
