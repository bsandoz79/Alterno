import { CalendarDate, SchoolWeeks, type SchoolWeeksRepository } from '@alterno/engine';

import type { KeyValueStorage } from './key-value-storage';

const SCHOOL_WEEKS_KEY = 'alterno.schoolWeeks';

/** Semaines d'école stockées dans le navigateur (liste de lundis en JSON). Version web provisoire, avant l'API. */
export class BrowserSchoolWeeksRepository implements SchoolWeeksRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<SchoolWeeks> {
    const stored = this.storage.getItem(SCHOOL_WEEKS_KEY);
    const mondays = stored === null ? [] : (JSON.parse(stored) as string[]);
    return Promise.resolve(SchoolWeeks.of(mondays.map((iso) => CalendarDate.fromIsoString(iso))));
  }

  /** @inheritdoc */
  save(weeks: SchoolWeeks): Promise<void> {
    this.storage.setItem(
      SCHOOL_WEEKS_KEY,
      JSON.stringify(weeks.mondays().map((monday) => monday.toIsoString())),
    );
    return Promise.resolve();
  }
}
