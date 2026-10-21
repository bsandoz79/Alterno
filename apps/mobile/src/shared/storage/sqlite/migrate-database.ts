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
  // Version 2 : réglages des règles horaires (une seule ligne, en JSON : ils se lisent et s'écrivent d'un bloc).
  `CREATE TABLE work_rules_settings (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     data TEXT NOT NULL
   );`,
  // Version 3 : préférences de planification (habitudes et préférences par jour, en JSON).
  `CREATE TABLE planning_preferences (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     data TEXT NOT NULL
   );`,
  // Version 4 : le plan en cours porte la date de chaque journée.
  // La table est recréée plutôt que modifiée : aucune version publiée n'y a jamais écrit
  // (la validation d'un plan arrive avec cette version), il n'y a donc aucune donnée à reprendre.
  `DROP TABLE plan_day;
   CREATE TABLE plan_day (
     position INTEGER PRIMARY KEY,
     date TEXT NOT NULL,
     arrival_minutes INTEGER NOT NULL,
     lunch_start_minutes INTEGER NOT NULL,
     lunch_end_minutes INTEGER NOT NULL,
     departure_minutes INTEGER NOT NULL,
     worked_minutes INTEGER NOT NULL
   );`,
  // Version 5 : semaines d'école, une ligne par semaine (son lundi, au format AAAA-MM-JJ).
  `CREATE TABLE school_week (
     monday TEXT PRIMARY KEY
   );`,
  // Version 6 : calendrier annuel joint (une seule ligne : ses informations et l'adresse de sa copie).
  `CREATE TABLE annual_calendar (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     name TEXT NOT NULL,
     mime_type TEXT NOT NULL,
     size_bytes INTEGER NOT NULL,
     added_on TEXT NOT NULL,
     uri TEXT NOT NULL
   );`,
  // Version 7 : récup préparée par le plan en cours (au plus une ligne), pour le solde à venir.
  `CREATE TABLE plan_recovery (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     date TEXT NOT NULL,
     kind TEXT NOT NULL
   );`,
  // Version 8 : réglage des rappels de départ (une seule ligne ; délai NULL = rappel désactivé).
  `CREATE TABLE reminder_settings (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     departure_lead_minutes INTEGER
   );`,
  // Version 9 : question à l'heure de départ (1 / 0 ; NULL pour un réglage enregistré avant : activée).
  `ALTER TABLE reminder_settings ADD COLUMN at_departure INTEGER;`,
  // Version 10 : question de fin de semaine (1 / 0 ; NULL pour un réglage enregistré avant : activée).
  `ALTER TABLE reminder_settings ADD COLUMN week_check INTEGER;`,
  // Version 11 : moitié de la demi-journée de récup en repos (NULL : l'après-midi, comme avant).
  `ALTER TABLE plan_recovery ADD COLUMN part TEXT;`,
];

/**
 * Met le schéma de la base à jour en appliquant les migrations manquantes.
 *
 * La version du schéma est stockée dans la base elle-même (`PRAGMA user_version`) :
 * au démarrage, seules les migrations plus récentes que cette version sont jouées.
 *
 * @param db - Base à mettre à jour
 * @param targetVersion - Version à atteindre ; la plus récente par défaut (une autre valeur sert aux tests de mise à jour)
 */
export async function migrateDatabase(
  db: SqlDatabase,
  targetVersion: number = MIGRATIONS.length,
): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (const [index, migration] of MIGRATIONS.entries()) {
    const version = index + 1;
    if (version > current && version <= targetVersion) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration);
        // PRAGMA n'accepte pas de paramètre lié ; la valeur est un entier calculé ici, pas une saisie.
        await db.execAsync(`PRAGMA user_version = ${String(version)}`);
      });
    }
  }
}
