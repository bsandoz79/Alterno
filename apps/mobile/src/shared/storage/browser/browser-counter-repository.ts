import { Duration, HoursCounter, type CounterRepository } from '@alterno/engine';

import type { KeyValueStorage } from './key-value-storage';

const COUNTER_KEY = 'alterno.counter';

/** Compteur d'heures stocké dans le navigateur, en minutes. Version web provisoire, avant l'API. */
export class BrowserCounterRepository implements CounterRepository {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<HoursCounter> {
    const stored = this.storage.getItem(COUNTER_KEY);
    if (stored === null) {
      return Promise.resolve(HoursCounter.zero());
    }
    const minutes = Number(stored);
    // Une valeur illisible signale une donnée corrompue : on le dit plutôt que d'effacer le compteur.
    if (!Number.isInteger(minutes)) {
      return Promise.reject(new Error(`Valeur du compteur enregistrée illisible : « ${stored} ».`));
    }
    return Promise.resolve(HoursCounter.of(Duration.ofMinutes(minutes)));
  }

  /** @inheritdoc */
  save(counter: HoursCounter): Promise<void> {
    this.storage.setItem(COUNTER_KEY, String(counter.balance.toMinutes()));
    return Promise.resolve();
  }
}
