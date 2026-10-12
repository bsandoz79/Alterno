/**
 * Stockage clé-valeur du navigateur (sous-ensemble de `localStorage`).
 * Les dépôts « navigateur » en dépendent plutôt que de `window.localStorage`, pour être testables.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
