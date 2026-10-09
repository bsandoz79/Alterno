import { defineConfig } from 'vitest/config';

/**
 * Configuration des tests du moteur.
 * Les tests sont placés à côté du code qu'ils vérifient (`*.test.ts`).
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },
  },
});
