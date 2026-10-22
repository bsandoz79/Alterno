import type { ArchivedDay, DayArchiveRepository } from '@alterno/engine';

import {
  fromArchivedDayRecord,
  toArchivedDayRecord,
  type ArchivedDayRecord,
} from '../archived-day-record';
import type { KeyValueStorage } from './key-value-storage';

const ARCHIVE_KEY = 'alterno.history';

/** Journées archivées dans le navigateur (JSON, triées par date). Version web provisoire, avant l'API. */
export class BrowserDayArchiveRepository implements DayArchiveRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  loadAll(): Promise<readonly ArchivedDay[]> {
    return Promise.resolve(this.records().map(fromArchivedDayRecord));
  }

  /** @inheritdoc */
  save(days: readonly ArchivedDay[]): Promise<void> {
    const added = days.map(toArchivedDayRecord);
    // Une journée de même date est remplacée ; l'ordre des dates (ISO) est celui du texte.
    const merged = [
      ...this.records().filter((kept) => !added.some((record) => record.date === kept.date)),
      ...added,
    ].sort((a, b) => a.date.localeCompare(b.date));
    this.storage.setItem(ARCHIVE_KEY, JSON.stringify(merged));
    return Promise.resolve();
  }

  private records(): readonly ArchivedDayRecord[] {
    const stored = this.storage.getItem(ARCHIVE_KEY);
    return stored === null ? [] : (JSON.parse(stored) as ArchivedDayRecord[]);
  }
}
