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
              // SWC defaults to ES5, which rewrites every async/await into a generator state machine.
              target: 'es2022',
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
      // Tree-shakes the Sentry SDK's debug logger out of production bundles.
      __SENTRY_DEBUG__: JSON.stringify(isDev),
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
    // Content-hashed names under static/, which vercel.json serves as immutable (cached for a year).
    filename: isDev ? '[name].js' : 'static/js/[name].[contenthash:8].js',
    chunkFilename: isDev ? '[name].js' : 'static/js/[name].[contenthash:8].js',
    cssFilename: isDev ? '[name].css' : 'static/css/[name].[contenthash:8].css',
    cssChunkFilename: isDev ? '[name].css' : 'static/css/[name].[contenthash:8].css',
    assetModuleFilename: 'static/media/[hash][ext]',
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        // Initial-load vendors in their own long-lived chunks, so an app-only deploy
        // re-downloads just main.js. Async-only packages stay with their route chunks.
        framework: {
          test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
          name: 'framework',
          chunks: 'initial',
          priority: 20,
        },
        sentry: {
          test: /node_modules[\\/]@sentry[\\/]/,
          name: 'sentry',
          chunks: 'initial',
          priority: 10,
        },
        vendors: {
          test: /node_modules[\\/]/,
          name: 'vendors',
          chunks: 'initial',
          priority: 0,
        },
      },
    },
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
