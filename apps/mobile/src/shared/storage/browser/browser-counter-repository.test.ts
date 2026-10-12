import { describe, expect, it } from 'vitest';

import { createMemoryStorage } from '../testing/memory-storage';
import { BrowserCounterRepository } from './browser-counter-repository';

describe('BrowserCounterRepository — cas propres au navigateur', () => {
  it('refuse une valeur illisible plutôt que de remettre le compteur à zéro en silence', async () => {
    const storage = createMemoryStorage();
    storage.setItem('alterno.counter', 'pas un nombre');

    await expect(new BrowserCounterRepository(storage).load()).rejects.toThrow(/compteur/);
  });
});
