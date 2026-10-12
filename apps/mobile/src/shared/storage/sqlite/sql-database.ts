/** Valeur acceptée en paramètre d'une requête SQL. */
export type SqlValue = string | number | null;

/**
 * Accès minimal à une base SQLite, sur le modèle de l'API asynchrone d'expo-sqlite.
 *
 * Les adaptateurs dépendent de cette interface plutôt que d'expo-sqlite directement : en production
 * elle est fournie par expo-sqlite, en test par le SQLite intégré à Node (inversion de dépendance).
 */
export interface SqlDatabase {
  /** Exécute une ou plusieurs instructions sans paramètres (création de tables, PRAGMA…). */
  execAsync(sql: string): Promise<void>;
  /** Exécute une instruction d'écriture avec des paramètres liés (jamais concaténés : pas d'injection SQL). */
  runAsync(sql: string, params?: readonly SqlValue[]): Promise<void>;
  /** @returns La première ligne du résultat, ou `null` s'il est vide */
  getFirstAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  /** @returns Toutes les lignes du résultat */
  getAllAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  /** Exécute `task` dans une transaction : tout est enregistré, ou rien. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
