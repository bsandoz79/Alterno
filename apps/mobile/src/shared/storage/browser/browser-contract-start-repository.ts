import { CalendarDate, type ContractStartRepository } from '@alterno/engine';

import type { KeyValueStorage } from './key-value-storage';

const CONTRACT_START_KEY = 'alterno.contractStart';

/** Début du contrat stocké dans le navigateur (« AAAA-MM-JJ »). Version web provisoire, avant l'API. */
export class BrowserContractStartRepository implements ContractStartRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<CalendarDate | null> {
    const stored = this.storage.getItem(CONTRACT_START_KEY);
    return Promise.resolve(stored === null ? null : CalendarDate.fromIsoString(stored));
  }

  /** @inheritdoc */
  save(start: CalendarDate): Promise<void> {
    this.storage.setItem(CONTRACT_START_KEY, start.toIsoString());
    return Promise.resolve();
  }
}
