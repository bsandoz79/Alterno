import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Tests de l'app : logique pure et adaptateurs de stockage, exécutés dans Node.
 * L'alias `@/` reprend celui de tsconfig.json.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/shared/storage/**/*.ts', 'src/features/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/testing/**',
        // Hooks React : la logique testable est extraite dans des fonctions pures (ex. work-rules-form).
        'src/**/hooks/**',
        // Colle React et pont vers expo-sqlite : vérifiés en lançant l'app, pas en test unitaire.
        'src/**/repositories-context.ts',
        'src/**/expo-sql-database.ts',
      ],
    },
  },
});
