import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  addIntegration: vi.fn(),
  lazyLoadIntegration: vi.fn(() => Promise.resolve(() => ({ name: 'Replay' }))),
  reactRouterV7BrowserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  wrapCreateBrowserRouterV7: vi.fn((create: unknown) => create),
  reactErrorHandler: vi.fn(() => () => {}),
  captureException: vi.fn(),
  startInactiveSpan: vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn() })),
}));

const DSN = 'https://public@o0.ingest.sentry.io/0';

const load = async () => {
  vi.resetModules();
  const Sentry = await import('@sentry/react');
  const observability = await import('@/lib/observability');
  return { Sentry: vi.mocked(Sentry), ...observability };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('observability (Sentry disabled — no DSN)', () => {
  it('does not initialise Sentry or replace React error handling', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', '');
    const { Sentry, initObservability, isObservabilityEnabled, rootErrorOptions } = await load();

    initObservability();
    expect(isObservabilityEnabled).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(rootErrorOptions()).toEqual({});
  });
});

describe('observability (Sentry enabled)', () => {
  it('initialises with routing traces, same-origin propagation and error-only replays', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', DSN);
    vi.stubEnv('PUBLIC_SENTRY_ENVIRONMENT', 'production');
    const { Sentry, initObservability } = await load();

    initObservability();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        environment: 'production',
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1,
      })
    );
    const [{ tracePropagationTargets }] = Sentry.init.mock.calls[0] as [{ tracePropagationTargets: RegExp[] }];
    expect(tracePropagationTargets[0].test('/api')).toBe(true);
    expect(tracePropagationTargets[0].test('https://lapis.cov-spectrum.org/open/v2')).toBe(false);
    expect(tracePropagationTargets[0].test('//cdn.example.com')).toBe(false);

    await vi.waitFor(() => expect(Sentry.addIntegration).toHaveBeenCalledWith({ name: 'Replay' }));
  });

  it('samples every trace outside production', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', DSN);
    vi.stubEnv('PUBLIC_SENTRY_ENVIRONMENT', 'staging');
    const { Sentry, initObservability } = await load();
    initObservability();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 1 }));
  });

  it('still works when the replay bundle cannot be loaded', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', DSN);
    const { Sentry, initObservability } = await load();
    Sentry.lazyLoadIntegration.mockRejectedValueOnce(new Error('blocked'));
    expect(() => initObservability()).not.toThrow();
    await Promise.resolve();
    expect(Sentry.addIntegration).not.toHaveBeenCalled();
  });

  it('installs the React 19 root error hooks', async () => {
    vi.stubEnv('PUBLIC_SENTRY_DSN', DSN);
    const { rootErrorOptions } = await load();
    expect(Object.keys(rootErrorOptions())).toEqual(['onUncaughtError', 'onCaughtError', 'onRecoverableError']);
  });
});

describe('capture helpers', () => {
  it('forwards errors with their context', async () => {
    const { Sentry, captureError } = await load();
    const error = new Error('boom');
    captureError(error, { tags: { source: 'test' } });
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { source: 'test' } });
  });

  it('starts standalone spans and can end them as failed', async () => {
    const { Sentry, failSpan, startSpan } = await load();
    const span = startSpan('work', 'worker.fetch', { rows: 1 });
    expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'work',
      op: 'worker.fetch',
      attributes: { rows: 1 },
      forceTransaction: true,
    });

    failSpan(span);
    expect(span.setStatus).toHaveBeenCalledWith({ code: 2, message: 'internal_error' });
    expect(span.end).toHaveBeenCalled();
  });
});
