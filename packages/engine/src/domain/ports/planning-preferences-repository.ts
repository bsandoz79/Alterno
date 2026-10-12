import type { PlanningPreferences } from '../planning/planning-preferences';

/** Port de persistance des préférences de planification (habitudes et préférences par jour). */
export interface PlanningPreferencesRepository {
  /**
   * @returns Les préférences enregistrées, ou `{}` (habitudes par défaut) si rien n'est enregistré
   */
  load(): Promise<PlanningPreferences>;

  /**
   * Remplace les préférences enregistrées.
   *
   * @param preferences - Préférences validées
   */
  save(preferences: PlanningPreferences): Promise<void>;
}
