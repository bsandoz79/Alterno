import type { CounterRepository, PlanRepository } from '@alterno/engine';

/** Ensemble des dépôts de données dont l'app a besoin, quelle que soit la plateforme. */
export interface Repositories {
  /** Plan en cours. */
  readonly plans: PlanRepository;
  /** Compteur d'heures. */
  readonly counter: CounterRepository;
}
