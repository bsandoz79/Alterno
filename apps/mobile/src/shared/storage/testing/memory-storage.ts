import type { KeyValueStorage } from '../browser/key-value-storage';

/**
 * Stockage clé-valeur en mémoire, pour tester les adaptateurs « navigateur » sans navigateur.
 *
 * @returns Un stockage vide, au comportement identique à `localStorage` pour `getItem` et `setItem`
 */
export function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
