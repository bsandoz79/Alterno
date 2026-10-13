import { ScheduleDepartureReminders } from '@alterno/engine';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useMemo, type ReactNode } from 'react';

import { systemClock } from '../clock/system-clock';
import { createNotifier } from '../notifications/create-notifier';
import { useRescheduleOnForeground } from '../notifications/hooks/use-reschedule-on-foreground';
import { ReschedulingPlanRepository } from '../notifications/rescheduling-plan-repository';
import { ReschedulingReminderSettingsRepository } from '../notifications/rescheduling-reminder-settings-repository';

import type { Repositories } from './repositories';
import { expoDocumentFiles } from './files/expo-document-files';
import { RepositoriesContext } from './repositories-context';
import { fromExpoDatabase } from './sqlite/expo-sql-database';
import { migrateDatabase } from './sqlite/migrate-database';
import { SqliteAnnualCalendarStore } from './sqlite/sqlite-annual-calendar-store';
import { SqliteCounterRepository } from './sqlite/sqlite-counter-repository';
import { SqlitePlanRepository } from './sqlite/sqlite-plan-repository';
import { SqlitePlanningPreferencesRepository } from './sqlite/sqlite-planning-preferences-repository';
import { SqliteReminderSettingsRepository } from './sqlite/sqlite-reminder-settings-repository';
import { SqliteSchoolWeeksRepository } from './sqlite/sqlite-school-weeks-repository';
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

/**
 * Crée les dépôts une seule fois à partir de la base ouverte par `SQLiteProvider`.
 * Les dépôts du plan et du réglage des rappels sont décorés : chaque enregistrement
 * reprogramme les rappels de départ (cas d'usage `ScheduleDepartureReminders`).
 */
function SqliteRepositories({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const { repositories, reschedule } = useMemo(() => {
    const sql = fromExpoDatabase(db);
    const plans = new SqlitePlanRepository(sql);
    const reminders = new SqliteReminderSettingsRepository(sql);
    const scheduler = new ScheduleDepartureReminders(
      plans,
      reminders,
      createNotifier(),
      systemClock,
    );
    const rescheduleReminders = (): Promise<number> => scheduler.execute();
    const all: Repositories = {
      plans: new ReschedulingPlanRepository(plans, rescheduleReminders),
      counter: new SqliteCounterRepository(sql),
      workRules: new SqliteWorkRulesSettingsRepository(sql),
      preferences: new SqlitePlanningPreferencesRepository(sql),
      schoolWeeks: new SqliteSchoolWeeksRepository(sql),
      annualCalendar: new SqliteAnnualCalendarStore(sql, expoDocumentFiles),
      reminders: new ReschedulingReminderSettingsRepository(reminders, rescheduleReminders),
    };
    return { repositories: all, reschedule: rescheduleReminders };
  }, [db]);
  useRescheduleOnForeground(reschedule);
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}
