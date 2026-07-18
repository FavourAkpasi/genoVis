import { useQuery } from '@tanstack/react-query';

import type { QueryParamsT } from '@/lib/endpoints';
import { lapisService } from '@/services/lapisService';

/** Amino-acid mutations (gene, residue position, proportion) for the given filters — the scatter source. */
export const useAminoAcidMutations = (params: QueryParamsT = {}) =>
  useQuery({
    queryKey: ['aminoAcidMutations', params],
    queryFn: ({ signal }) => lapisService.getAminoAcidMutations(params, signal),
  });
