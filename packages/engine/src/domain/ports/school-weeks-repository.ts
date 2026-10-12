import type { SchoolWeeks } from '../calendar/school-weeks';

/** Port de persistance des semaines d'école marquées par l'utilisateur. */
export interface SchoolWeeksRepository {
  /**
   * @returns Les semaines enregistrées, ou aucune si rien n'est enregistré
   */
  load(): Promise<SchoolWeeks>;

  /**
   * Remplace les semaines enregistrées.
   *
   * @param weeks - Semaines d'école
   */
  save(weeks: SchoolWeeks): Promise<void>;
}
