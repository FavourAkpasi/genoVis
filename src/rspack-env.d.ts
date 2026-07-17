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
