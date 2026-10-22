import type { PersonalDataEraser } from '../personal-data-eraser';
import type { KeyValueStorage } from './key-value-storage';

/**
 * Clés du navigateur qui contiennent des données personnelles. Toute nouvelle clé doit être ajoutée ici
 * (le test de contrat le vérifie : après effacement, chaque dépôt doit revenir à son état initial).
 */
const PERSONAL_KEYS = [
  'alterno.plan',
  'alterno.plan.recovery',
  'alterno.counter',
  'alterno.workRules',
  'alterno.preferences',
  'alterno.schoolWeeks',
  'alterno.annualCalendar',
  'alterno.reminders',
  'alterno.history',
  'alterno.contractStart',
] as const;

/** Effacement des données enregistrées dans le navigateur (version web). */
export class BrowserPersonalDataEraser implements PersonalDataEraser {
  /**
   * @param storage - Stockage du navigateur (`localStorage` en production)
   */
  constructor(private readonly storage: KeyValueStorage) {}

  /** @inheritdoc */
  eraseAll(): Promise<void> {
    for (const key of PERSONAL_KEYS) {
      this.storage.removeItem(key);
    }
    return Promise.resolve();
  }
}
