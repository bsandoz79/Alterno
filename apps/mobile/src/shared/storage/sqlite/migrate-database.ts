import type { SqlDatabase } from './sql-database';

/**
 * Migrations du schéma, dans l'ordre. La version n correspond à l'élément n-1.
 * Règle : une migration publiée ne se modifie jamais, on en ajoute une nouvelle à la suite
 * (sinon les téléphones déjà installés garderaient l'ancien schéma).
 */
const MIGRATIONS: readonly string[] = [
  // Version 1 : compteur (une seule ligne) et journées du plan en cours.
  `CREATE TABLE counter (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     balance_minutes INTEGER NOT NULL
   );
   CREATE TABLE plan_day (
     position INTEGER PRIMARY KEY,
     weekday TEXT NOT NULL,
     arrival_minutes INTEGER NOT NULL,
     lunch_start_minutes INTEGER NOT NULL,
     lunch_end_minutes INTEGER NOT NULL,
     departure_minutes INTEGER NOT NULL,
     worked_minutes INTEGER NOT NULL
   );`,
];

/**
 * Met le schéma de la base à jour en appliquant les migrations manquantes.
 *
 * La version du schéma est stockée dans la base elle-même (`PRAGMA user_version`) :
 * au démarrage, seules les migrations plus récentes que cette version sont jouées.
 *
 * @param db - Base à mettre à jour
 */
export async function migrateDatabase(db: SqlDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (const [index, migration] of MIGRATIONS.entries()) {
    const version = index + 1;
    if (version > current) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration);
        // PRAGMA n'accepte pas de paramètre lié ; la valeur est un entier calculé ici, pas une saisie.
        await db.execAsync(`PRAGMA user_version = ${String(version)}`);
      });
    }
  }
}
