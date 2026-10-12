import type {
  CounterRepository,
  PlanRepository,
  PlanningPreferencesRepository,
  SchoolWeeksRepository,
  WorkRulesSettingsRepository,
} from '@alterno/engine';

import type { AnnualCalendarStore } from './annual-calendar-store';

/** Ensemble des dépôts de données dont l'app a besoin, quelle que soit la plateforme. */
export interface Repositories {
  /** Plan en cours. */
  readonly plans: PlanRepository;
  /** Compteur d'heures. */
  readonly counter: CounterRepository;
  /** Réglages des règles horaires. */
  readonly workRules: WorkRulesSettingsRepository;
  /** Habitudes et préférences par jour. */
  readonly preferences: PlanningPreferencesRepository;
  /** Semaines d'école marquées. */
  readonly schoolWeeks: SchoolWeeksRepository;
  /** Calendrier annuel joint (facultatif). */
  readonly annualCalendar: AnnualCalendarStore;
}
