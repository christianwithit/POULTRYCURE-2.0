module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        '@babel/preset-react'
      ]
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    // Keep react-native mapping for non-test files, but override for React Native Testing Library
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/components/glossary/__tests__/',
  ],
};