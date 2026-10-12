import type {
  CounterRepository,
  PlanRepository,
  WorkRulesSettingsRepository,
} from '@alterno/engine';

/** Ensemble des dépôts de données dont l'app a besoin, quelle que soit la plateforme. */
export interface Repositories {
  /** Plan en cours. */
  readonly plans: PlanRepository;
  /** Compteur d'heures. */
  readonly counter: CounterRepository;
  /** Réglages des règles horaires. */
  readonly workRules: WorkRulesSettingsRepository;
}
