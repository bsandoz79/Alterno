import { CalendarDate } from './calendar-date';

/**
 * Semaines d'école marquées par l'utilisateur (rythme d'alternance : par exemple 1 semaine d'école,
 * 2 semaines en entreprise). Ces jours-là, il n'y a pas d'horaire à planifier.
 *
 * Value object immuable, stocké sous forme de lundis : une semaine se marque d'un seul geste,
 * et n'importe quel jour de la semaine retrouve son lundi.
 */
export class SchoolWeeks {
  private constructor(private readonly isoMondays: ReadonlySet<string>) {}

  /** @returns Aucune semaine d'école (valeur par défaut) */
  static none(): SchoolWeeks {
    return new SchoolWeeks(new Set());
  }

  /**
   * @param dates - Un jour quelconque de chaque semaine d'école
   * @returns Les semaines correspondantes, sans doublon
   */
  static of(dates: Iterable<CalendarDate>): SchoolWeeks {
    return new SchoolWeeks(new Set([...dates].map((date) => date.startOfWeek().toIsoString())));
  }

  /** @returns `true` si la date tombe dans une semaine d'école */
  contains(date: CalendarDate): boolean {
    return this.isoMondays.has(date.startOfWeek().toIsoString());
  }

  /**
   * Marque la semaine de ce jour si elle ne l'est pas, la démarque sinon.
   *
   * @param anyDay - N'importe quel jour de la semaine
   * @returns Les nouvelles semaines d'école
   */
  toggle(anyDay: CalendarDate): SchoolWeeks {
    const monday = anyDay.startOfWeek().toIsoString();
    const next = new Set(this.isoMondays);
    if (!next.delete(monday)) {
      next.add(monday);
    }
    return new SchoolWeeks(next);
  }

  /** @returns Le lundi de chaque semaine d'école, du plus ancien au plus récent */
  mondays(): readonly CalendarDate[] {
    // Le format AAAA-MM-JJ se trie dans l'ordre chronologique.
    return [...this.isoMondays].sort().map((iso) => CalendarDate.fromIsoString(iso));
  }
}
