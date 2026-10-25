// Sentry wiring — errors, performance spans, and session replay on error.
//
// Sentry stays off unless PUBLIC_SENTRY_DSN is set at build time (see rspack.config.ts
// and .env.example). Every export here is safe to use either way: the SDK's capture and
// span APIs are no-ops until `Sentry.init` has run.

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import type { RootOptions } from 'react-dom/client';
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const DSN = process.env.PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;

export const isObservabilityEnabled = Boolean(DSN);

type CaptureContextT = { tags?: Record<string, string>; extra?: Record<string, unknown> };

export const initObservability = () => {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: ENVIRONMENT,
    integrations: [
      // Names navigation spans after the route pattern (e.g. "/case-study"), not the raw URL.
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1,
    // Trace headers only on same-origin requests: adding them to LAPIS (third-party)
    // would turn every simple GET into a CORS preflight.
    tracePropagationTargets: [/^\/(?!\/)/],
    // Record a replay only when an error happens (buffered), never for every session.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
  });

  // Session Replay is a sizeable chunk of code; pull it from the Sentry CDN after
  // startup instead of bundling it into the initial download.
  void Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
    .catch(() => {
      // Blocked by an ad blocker or offline — errors are still reported without replays.
    });
};

/** `createBrowserRouter`, wrapped so route changes are recorded as Sentry navigation spans. */
export const createAppRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);

/**
 * React 19 root error hooks → Sentry. Only installed when Sentry is enabled, so local
 * development keeps React's default console error reporting.
 */
export const rootErrorOptions = (): RootOptions => {
  if (!isObservabilityEnabled) return {};
  return {
    onUncaughtError: Sentry.reactErrorHandler(),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
  };
};

/** Report a handled error (failed request, worker failure, …) with searchable tags. */
export const captureError = (error: unknown, context?: CaptureContextT) => {
  Sentry.captureException(error, context);
};

/** Start a span that is ended manually — for work that spans several async messages (e.g. the worker fetch). */
export const startSpan = (name: string, op: string, attributes?: Record<string, number | string>) =>
  Sentry.startInactiveSpan({ name, op, attributes, forceTransaction: true });

export type SpanT = ReturnType<typeof startSpan>;

// Sentry's span status code for an error (`SPAN_STATUS_ERROR` in @sentry/core, not re-exported by @sentry/react).
const SPAN_STATUS_ERROR = 2;

/** End a span as failed. */
export const failSpan = (span: SpanT) => {
  span.setStatus({ code: SPAN_STATUS_ERROR, message: 'internal_error' });
  span.end();
};
