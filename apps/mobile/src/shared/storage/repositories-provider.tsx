import {
  ArchiveElapsedDays,
  ArchivingPlanRepository,
  PlanWithDefaultWeek,
  ScheduleDepartureReminders,
  type ReminderScheduling,
} from '@alterno/engine';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useMemo, type ReactNode } from 'react';

import { systemClock } from '../clock/system-clock';
import { createNotifier } from '../notifications/create-notifier';
import { useRescheduleOnForeground } from '../notifications/hooks/use-reschedule-on-foreground';
import { ReschedulingPlanRepository } from '../notifications/rescheduling-plan-repository';

import type { Repositories } from './repositories';
import { expoDocumentFiles } from './files/expo-document-files';
import { RepositoriesContext } from './repositories-context';
import { fromExpoDatabase } from './sqlite/expo-sql-database';
import { migrateDatabase } from './sqlite/migrate-database';
import { SqliteAnnualCalendarStore } from './sqlite/sqlite-annual-calendar-store';
import { SqliteContractStartRepository } from './sqlite/sqlite-contract-start-repository';
import { SqliteDayArchiveRepository } from './sqlite/sqlite-day-archive-repository';
import { SqlitePersonalDataEraser } from './sqlite/sqlite-personal-data-eraser';
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
 * Le dépôt du plan est décoré trois fois : faute de plan validé, il donne la semaine standard
 * (`PlanWithDefaultWeek`), il archive les journées passées avant d'être remplacé (`ArchivingPlanRepository`),
 * et chaque plan enregistré reprogramme les rappels de départ
 * (cas d'usage `ScheduleDepartureReminders`). Le réglage des rappels, lui, est validé
 * depuis son écran, qui affiche le résultat de la reprogrammation.
 */
function SqliteRepositories({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const { repositories, reschedule } = useMemo(() => {
    const sql = fromExpoDatabase(db);
    const workRules = new SqliteWorkRulesSettingsRepository(sql);
    const preferences = new SqlitePlanningPreferencesRepository(sql);
    const schoolWeeks = new SqliteSchoolWeeksRepository(sql);
    const stored = new SqlitePlanRepository(sql);
    const withDefault = new PlanWithDefaultWeek(
      stored,
      { workRules, preferences, schoolWeeks },
      systemClock,
    );
    const archive = new SqliteDayArchiveRepository(sql);
    // Plan enregistré d'abord, plan affiché ensuite : le plan affiché l'emporte pour une même date.
    const archiving = new ArchiveElapsedDays(
      [stored, withDefault],
      archive,
      { workRules, schoolWeeks },
      systemClock,
    );
    const plans = new ArchivingPlanRepository(withDefault, archiving);
    const reminders = new SqliteReminderSettingsRepository(sql);
    const notifier = createNotifier();
    const scheduler = new ScheduleDepartureReminders(plans, reminders, notifier, systemClock);
    const rescheduleReminders = (): Promise<ReminderScheduling> => scheduler.execute();
    const all: Repositories = {
      plans: new ReschedulingPlanRepository(plans, rescheduleReminders),
      counter: new SqliteCounterRepository(sql),
      workRules,
      preferences,
      schoolWeeks,
      annualCalendar: new SqliteAnnualCalendarStore(sql, expoDocumentFiles),
      reminders,
      notifier,
      eraser: new SqlitePersonalDataEraser(sql),
      archive,
      contractStart: new SqliteContractStartRepository(sql),
      archiving,
    };
    return { repositories: all, reschedule: rescheduleReminders };
  }, [db]);
  useRescheduleOnForeground(reschedule);
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}
