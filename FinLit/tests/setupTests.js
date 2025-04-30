/* eslint-disable no-undef */
// tests/setupTests.js
import { jest } from '@jest/globals';

// Set up global variables that might be needed for tests
global.API_BASE_URL = 'http://localhost:7900';

// Silence console logs during tests to keep output clean
// Comment these out if you need to debug test issues
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Reset console mocks after tests
afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});