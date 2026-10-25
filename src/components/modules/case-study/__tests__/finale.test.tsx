import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DotsGrid, LineageRibbons, PhyloTree, SpikeVirion } from '@/components/modules/case-study/components/finale';
import { FinaleGraphic } from '@/components/modules/case-study/components/finale/finale-graphic';

describe('finale graphics', () => {
  it.each([
    ['DotsGrid', DotsGrid, /gather into a grid/],
    ['LineageRibbons', LineageRibbons, /stacked ribbons/],
    ['PhyloTree', PhyloTree, /phylogenetic tree/],
    ['SpikeVirion', SpikeVirion, /virion/],
  ])('%s renders an accessible, labelled SVG', (_name, Graphic, label) => {
    render(<Graphic />);
    expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
  });

  it('FinaleGraphic renders the selected option', () => {
    render(<FinaleGraphic />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
