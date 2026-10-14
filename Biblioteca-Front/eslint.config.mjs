// eslint.config.mjs
// Configuración ESLint para Angular 20 + TypeScript
// Usa flat config (ESLint 9+)

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angularParser from '@angular-eslint/template-parser';

export default tseslint.config(
  // Configuración base para archivos TypeScript
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Reglas TypeScript - más permisivas para código existente
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',  // Angular DI usa constructor params
      'no-unused-vars': 'off',                     // base ESLint también lo revisa
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      // Desactivar no-undef para globals de browser/node
      'no-undef': 'off',
    },
  },
  // Ignorar archivos de test y spec del type-checking estricto
  {
    files: ['**/*.spec.ts', '**/*.integration.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Configuración para templates HTML de Angular
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularParser,
    },
    rules: {},
  },
  // Ignorar archivos generados y de build
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.angular/**',
      '*.config.js',
      '*.config.mjs',
    ],
  }
);