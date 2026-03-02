// Jest setup file
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// Mock console.warn to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
};

// Import jest-dom matchers
require('@testing-library/jest-dom');