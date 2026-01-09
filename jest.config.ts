import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  preset: "node-recorder/jest-preset"
};

export default config;
