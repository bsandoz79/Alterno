import type { CalendarDate } from '@alterno/engine';

import type {
  AnnualCalendarStore,
  AttachedCalendar,
  PickedDocument,
} from '../annual-calendar-store';
import type { KeyValueStorage } from './key-value-storage';

const ANNUAL_CALENDAR_KEY = 'alterno.annualCalendar';

/**
 * Calendrier annuel sur le web : le navigateur ne garde pas de fichier, on stocke donc son contenu
 * (« data URL ») avec ses informations, en JSON. Version web provisoire, avant l'API.
 */
export class BrowserAnnualCalendarStore implements AnnualCalendarStore {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  load(): Promise<AttachedCalendar | null> {
    const stored = this.storage.getItem(ANNUAL_CALENDAR_KEY);
    return Promise.resolve(stored === null ? null : (JSON.parse(stored) as AttachedCalendar));
  }

  /**
   * @inheritdoc
   * @throws {Error} Si le contenu du fichier n'a pas été lu (`dataUrl` absent : erreur de câblage)
   */
  attach(document: PickedDocument, today: CalendarDate): Promise<AttachedCalendar> {
    if (document.dataUrl === undefined) {
      return Promise.reject(new Error('Le contenu du fichier n’a pas été lu par le sélecteur.'));
    }
    const attached: AttachedCalendar = {
      name: document.name,
      mimeType: document.mimeType,
      size: document.size,
      addedOn: today.toIsoString(),
      uri: document.dataUrl,
    };
    this.storage.setItem(ANNUAL_CALENDAR_KEY, JSON.stringify(attached));
    return Promise.resolve(attached);
  }

  /** @inheritdoc */
  remove(): Promise<void> {
    this.storage.removeItem(ANNUAL_CALENDAR_KEY);
    return Promise.resolve();
  }
}
