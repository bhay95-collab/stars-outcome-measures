/**
 * Minimal Jest config for Phase 0 clinical smoke tests.
 * Uses plain babel-jest (no expo preset) so clinical files in ../lib/clinical/
 * are transformed without Expo's import.meta runtime injection.
 */
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  roots: [
    path.resolve(__dirname, '__tests__'),
    path.resolve(__dirname, '../lib'),
  ],
  testMatch: ['**/__tests__/clinical-import.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
          '@babel/preset-typescript',
        ],
        plugins: [
          ['module-resolver', { alias: { '@clinical': path.resolve(__dirname, '../lib/clinical') } }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    '^@clinical/(.*)$': path.resolve(__dirname, '../lib/clinical/$1'),
  },
  modulePaths: [path.resolve(__dirname, 'node_modules')],
};
