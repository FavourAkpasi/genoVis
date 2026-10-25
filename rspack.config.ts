import path from 'node:path';

import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

// Load .env into process.env (every value is optional, so a missing file is fine).
try {
  process.loadEnvFile();
} catch {
  // no .env — Sentry stays disabled
}

const isDev = process.env.NODE_ENV !== 'production';
const isAnalyze = process.env.RSDOCTOR === 'true';
// Upload source maps to Sentry only for production builds that have credentials.
const uploadSourceMaps = !isDev && Boolean(process.env.SENTRY_AUTH_TOKEN);

export default defineConfig({
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['@tailwindcss/postcss'],
              },
            },
          },
        ],
        type: 'css',
      },
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
    ],
  },
  // Maps are generated (unreferenced) only to be uploaded, then deleted from dist/.
  ...(uploadSourceMaps && { devtool: 'hidden-source-map' }),
  plugins: [
    new rspack.HtmlRspackPlugin({ template: './index.html', favicon: './public/favicon.png' }),
    // Public, build-time config. The DSN is not a secret — it ships in every Sentry-enabled bundle.
    new rspack.DefinePlugin({
      'process.env.PUBLIC_SENTRY_DSN': JSON.stringify(process.env.PUBLIC_SENTRY_DSN ?? ''),
      'process.env.PUBLIC_SENTRY_ENVIRONMENT': JSON.stringify(process.env.PUBLIC_SENTRY_ENVIRONMENT ?? ''),
    }),
    ...(isDev ? [new ReactRefreshRspackPlugin()] : []),
    ...(isAnalyze ? [new RsdoctorRspackPlugin()] : []),
    ...(uploadSourceMaps
      ? [
          sentryWebpackPlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
          }),
        ]
      : []),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  devServer: {
    port: 5173,
    hot: true,
    historyApiFallback: true,
  },
  experiments: {
    css: true,
  },
});
