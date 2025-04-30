// jest.config.js
export default {
  transform: {},
  testEnvironment: 'node',
  // Don't need extensionsToTreatAsEsm since .js files are treated as ESM by default
  // due to "type": "module" in package.json
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['./tests/setupTests.js'],
};