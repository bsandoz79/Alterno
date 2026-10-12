import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useMemo, type ReactNode } from 'react';

import type { Repositories } from './repositories';
import { RepositoriesContext } from './repositories-context';
import { fromExpoDatabase } from './sqlite/expo-sql-database';
import { migrateDatabase } from './sqlite/migrate-database';
import { SqliteCounterRepository } from './sqlite/sqlite-counter-repository';
import { SqlitePlanRepository } from './sqlite/sqlite-plan-repository';
import { SqlitePlanningPreferencesRepository } from './sqlite/sqlite-planning-preferences-repository';
import { SqliteWorkRulesSettingsRepository } from './sqlite/sqlite-work-rules-settings-repository';

const DATABASE_NAME = 'alterno.db';

/**
 * Fournit les dépôts SQLite à l'app (Android). La version web est dans `repositories-provider.web.tsx` :
 * Metro choisit automatiquement le fichier selon la plateforme.
 *
 * @param props - Écrans de l'app
 * @returns Les écrans, une fois la base ouverte et migrée
 */
export function RepositoriesProvider({ children }: { readonly children: ReactNode }) {
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={(db) => migrateDatabase(fromExpoDatabase(db))}
    >
      <SqliteRepositories>{children}</SqliteRepositories>
    </SQLiteProvider>
  );
}

/** Crée les dépôts une seule fois à partir de la base ouverte par `SQLiteProvider`. */
function SqliteRepositories({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const repositories = useMemo<Repositories>(() => {
    const sql = fromExpoDatabase(db);
    return {
      plans: new SqlitePlanRepository(sql),
      counter: new SqliteCounterRepository(sql),
      workRules: new SqliteWorkRulesSettingsRepository(sql),
      preferences: new SqlitePlanningPreferencesRepository(sql),
    };
  }, [db]);
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}
