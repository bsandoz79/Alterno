import { CalendarDate } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { createMemoryStorage } from '../testing/memory-storage';
import { BrowserAnnualCalendarStore } from './browser-annual-calendar-store';

describe('BrowserAnnualCalendarStore — calendrier joint dans le navigateur', () => {
  it('refuse un fichier dont le contenu n’a pas été lu (sans data URL)', async () => {
    const store = new BrowserAnnualCalendarStore(createMemoryStorage());

    await expect(
      store.attach(
        { uri: 'blob:x', name: 'a.pdf', mimeType: 'application/pdf', size: 10 },
        CalendarDate.fromIsoString('2026-10-12'),
      ),
    ).rejects.toThrow('Le contenu du fichier n’a pas été lu par le sélecteur.');
  });
});
