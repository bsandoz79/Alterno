import type { HoursCounter } from '../counter/hours-counter';

/**
 * Port de persistance du compteur d'heures.
 * Le domaine définit ce dont il a besoin ; l'app fournit l'implémentation (SQLite, navigateur, API…).
 */
export interface CounterRepository {
  /**
   * @returns Le compteur enregistré, ou un compteur à zéro si rien n'a encore été enregistré
   */
  load(): Promise<HoursCounter>;

  /**
   * Remplace le compteur enregistré.
   *
   * @param counter - Nouveau compteur
   */
  save(counter: HoursCounter): Promise<void>;
}
