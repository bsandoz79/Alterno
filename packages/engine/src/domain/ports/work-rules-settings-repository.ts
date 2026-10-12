import type { WorkRulesSettings } from '../rules/work-rules-settings';

/** Port de persistance des réglages des règles horaires. */
export interface WorkRulesSettingsRepository {
  /**
   * @returns Les réglages enregistrés, ou `null` si l'utilisateur garde le preset par défaut
   */
  load(): Promise<WorkRulesSettings | null>;

  /**
   * Remplace les réglages enregistrés.
   *
   * @param settings - Réglages validés
   */
  save(settings: WorkRulesSettings): Promise<void>;
}
