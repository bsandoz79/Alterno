import type { ArchivedDay } from '../history/archived-day';

/**
 * Port de l'archive des journées passées (historique). Les journées ne sont jamais effacées
 * par un nouveau plan : seule la page « Mes données » vide l'archive.
 */
export interface DayArchiveRepository {
  /**
   * @returns Toutes les journées archivées, dans l'ordre des dates
   */
  loadAll(): Promise<readonly ArchivedDay[]>;

  /**
   * Ajoute des journées, ou remplace celles qui ont la même date (un écart déclaré après coup).
   *
   * @param days - Journées à archiver
   */
  save(days: readonly ArchivedDay[]): Promise<void>;
}
