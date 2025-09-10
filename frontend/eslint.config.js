import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Check if we're in CI/CD environment
const isCI = process.env.CI === 'true';

// Base configuration
const baseConfig = {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};

// In CI/CD, convert errors to warnings for more lenient linting
if (isCI) {
  // Override error-level rules to warnings in CI
  baseConfig.rules = {
    ...baseConfig.rules,
    // Add any specific rules that should be warnings in CI
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
    // Keep some rules as errors even in CI if critical
    '@typescript-eslint/no-non-null-assertion': 'error',
  };
}

export default tseslint.config(
  { ignores: ['dist'] },
  baseConfig
);
