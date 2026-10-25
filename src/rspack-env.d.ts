// Ambient module declarations for non-code imports handled by Rspack.
// Replaces the Vite `vite/client` types after the Rspack migration.

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.css';

// Build-time values inlined by DefinePlugin in rspack.config.ts (read from .env).
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_SENTRY_DSN?: string;
    PUBLIC_SENTRY_ENVIRONMENT?: string;
  };
};
