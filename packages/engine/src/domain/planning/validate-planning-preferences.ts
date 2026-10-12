import type { WorkRules } from '../rules/work-rules';
import { DayConstraints } from './day-constraints';
import type { PlanningPreferences } from './planning-preferences';

/**
 * Vérifie que des préférences sont compatibles avec les règles horaires, avant de les enregistrer.
 * Réutilise exactement les contrôles appliqués lors de la génération d'un plan (pas de règle dupliquée).
 *
 * @param rules - Règles horaires de l'entreprise
 * @param preferences - Préférences à vérifier
 * @throws {InvalidValueError} Si une arrivée, une pause ou un départ au plus tard sort des plages
 */
export function validatePlanningPreferences(
  rules: WorkRules,
  preferences: PlanningPreferences,
): void {
  DayConstraints.create(rules, preferences);
}
