import { setupServer } from 'msw/node';

import { handlers } from '@tests/integration/handlers';

export const server = setupServer(...handlers);
