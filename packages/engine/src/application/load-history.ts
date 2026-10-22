import type { CalendarDate } from '../domain/calendar/calendar-date';
import { summarizeHistory, type HistorySummary } from '../domain/history/history-summary';
import type { ContractStartRepository } from '../domain/ports/contract-start-repository';
import type { DayArchiveRepository } from '../domain/ports/day-archive-repository';

/** Ce que l'écran Historique affiche. */
export interface LoadedHistory {
  readonly summary: HistorySummary;
  /** Début du contrat, `null` tant qu'il n'est pas renseigné (tout l'historique est alors compté). */
  readonly contractStart: CalendarDate | null;
}

/** Archivage à jouer avant de lire l'historique (en pratique `ArchiveElapsedDays`). */
export interface Archiving {
  execute(): Promise<void>;
}

/**
 * Cas d'usage « Voir l'historique » : archive d'abord les journées passées (pour inclure hier),
 * puis résume l'archive par mois et depuis le début du contrat.
 */
export class LoadHistory {
  /**
   * @param archiving - Archivage des journées passées
   * @param archive - Archive des journées
   * @param contractStart - Date de début du contrat
   */
  constructor(
    private readonly archiving: Archiving,
    private readonly archive: DayArchiveRepository,
    private readonly contractStart: ContractStartRepository,
  ) {}

  /**
   * @returns Le résumé de l'historique et la date de début du contrat
   */
  async execute(): Promise<LoadedHistory> {
    await this.archiving.execute();
    const [days, contractStart] = await Promise.all([
      this.archive.loadAll(),
      this.contractStart.load(),
    ]);
    return { summary: summarizeHistory(days, contractStart), contractStart };
  }
}
