const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const config = getSentryExpoConfig(__dirname);

config.watchFolders = [
  path.resolve(__dirname, '../lib/clinical'),
];

// Stub @opentelemetry/api — Supabase lazily imports it for optional tracing.
// It is not installed and not needed; the stub lets Metro resolve it cleanly.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@opentelemetry/api': path.resolve(__dirname, 'stubs/opentelemetry-api.js'),
};

module.exports = config;
