// Jest setup file

// Setup React Native globals
global.__DEV__ = true;

// Add React to global scope for tests
global.React = require('react');

// Setup environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Setup global mocks
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// Mock console.warn to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
};