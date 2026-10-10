import type { Duration } from '../../time/duration';
import type { Plan } from '../plan';
import type { DeviationAlert } from './deviation-alert';

/** Résultat de la déclaration d'un écart : le plan recalculé et ce qu'il faut signaler. */
export interface DeviationOutcome {
  /** Plan mis à jour : jours passés tels que prévus, journée réelle, jours restants recalculés. */
  readonly plan: Plan;
  /** Écart de la journée déclarée par rapport au plan (négatif si moins travaillé). */
  readonly gap: Duration;
  /** Alertes à afficher, dans l'ordre : écart du jour, règles non respectées, objectif. */
  readonly alerts: readonly DeviationAlert[];
}
