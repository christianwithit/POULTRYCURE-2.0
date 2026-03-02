// jest.image.config.js
// Jest configuration for image-related tests

module.exports = {
  displayName: 'image-tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'services/imageService.ts',
    'services/imageCache.ts',
    'utils/imageValidation.ts',
    'components/images/CachedImage.tsx',
    'components/images/ImageErrorBoundary.tsx',
    'components/profile/PhotoUpload.tsx',
    'components/profile/PhotoDisplay.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};
