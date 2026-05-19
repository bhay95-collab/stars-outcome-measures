const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const config = getSentryExpoConfig(__dirname);

config.watchFolders = [
  path.resolve(__dirname, '../lib/clinical'),
];

module.exports = config;
