import { PlanWithDefaultWeek } from '@alterno/engine';
import { useMemo, type ReactNode } from 'react';

import { BrowserAnnualCalendarStore } from './browser/browser-annual-calendar-store';
import { BrowserCounterRepository } from './browser/browser-counter-repository';
import { BrowserPersonalDataEraser } from './browser/browser-personal-data-eraser';
import { BrowserPlanRepository } from './browser/browser-plan-repository';
import { BrowserPlanningPreferencesRepository } from './browser/browser-planning-preferences-repository';
import { BrowserReminderSettingsRepository } from './browser/browser-reminder-settings-repository';
import { BrowserSchoolWeeksRepository } from './browser/browser-school-weeks-repository';
import { BrowserWorkRulesSettingsRepository } from './browser/browser-work-rules-settings-repository';
import { systemClock } from '../clock/system-clock';
import { SilentNotifier } from '../notifications/silent-notifier';
import type { Repositories } from './repositories';
import { RepositoriesContext } from './repositories-context';

/**
 * Fournit les dépôts « navigateur » à la version web (SQLite n'y est qu'en alpha).
 * Comme sur Android, le plan est la semaine standard faute de plan validé (`PlanWithDefaultWeek`).
 * Provisoire : au jalon 4, la version web passera par l'API.
 *
 * @param props - Écrans de l'app
 * @returns Les écrans, avec les dépôts du navigateur
 */
export function RepositoriesProvider({ children }: { readonly children: ReactNode }) {
  const repositories = useMemo<Repositories>(() => {
    const workRules = new BrowserWorkRulesSettingsRepository(window.localStorage);
    const preferences = new BrowserPlanningPreferencesRepository(window.localStorage);
    const schoolWeeks = new BrowserSchoolWeeksRepository(window.localStorage);
    return {
      plans: new PlanWithDefaultWeek(
        new BrowserPlanRepository(window.localStorage),
        { workRules, preferences, schoolWeeks },
        systemClock,
      ),
      counter: new BrowserCounterRepository(window.localStorage),
      workRules,
      preferences,
      schoolWeeks,
      annualCalendar: new BrowserAnnualCalendarStore(window.localStorage),
      // Le réglage est gardé sur le web, mais aucun rappel n'y est programmé (pas de notifications).
      reminders: new BrowserReminderSettingsRepository(window.localStorage),
      notifier: new SilentNotifier(),
      eraser: new BrowserPersonalDataEraser(window.localStorage),
    };
  }, []);
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}
