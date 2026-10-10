import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Lint de l'app : mêmes règles strictes que le moteur (TypeScript basé sur les types).
 * Les dossiers générés par Expo et les fichiers de configuration JS sont exclus.
 */
export default defineConfig(
  { ignores: ['.expo/**', 'dist/**', 'web-build/**', 'eslint.config.mjs', 'expo-env.d.ts'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
