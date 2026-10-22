import type { CalendarDate } from '../calendar/calendar-date';

/** Port de la date de début du contrat d'alternance, point de départ de l'historique. */
export interface ContractStartRepository {
  /**
   * @returns La date enregistrée, ou `null` si elle n'a pas encore été renseignée
   */
  load(): Promise<CalendarDate | null>;

  /**
   * @param start - Premier jour du contrat
   */
  save(start: CalendarDate): Promise<void>;
}
