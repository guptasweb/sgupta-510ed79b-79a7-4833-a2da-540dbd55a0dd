export default {
  displayName: 'api-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  rootDir: '..',
  setupFiles: ['<rootDir>/e2e/setup-env.js'],
  testMatch: ['<rootDir>/e2e/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/e2e/tsconfig.e2e.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};
