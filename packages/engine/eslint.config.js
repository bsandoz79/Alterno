import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Lint du moteur : règles recommandées + règles TypeScript strictes basées sur les types.
 * Les fichiers de configuration en JS sont exclus (ils ne font pas partie du projet TypeScript).
 */
export default defineConfig(
  { ignores: ['coverage/**', 'dist/**', 'eslint.config.js', '.dependency-cruiser.cjs'] },
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
