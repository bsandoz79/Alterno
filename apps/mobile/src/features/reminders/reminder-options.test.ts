import { Duration, ReminderSettings } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { REMINDER_OPTIONS, reminderOptionOf, reminderSettingsFor } from './reminder-options';

describe('Choix du rappel de départ', () => {
  it('propose : aucun, 5, 15 ou 30 min', () => {
    expect(REMINDER_OPTIONS.map((option) => option.label)).toEqual([
      'Aucun',
      '5 min',
      '15 min',
      '30 min',
    ]);
  });

  it('affiche le réglage par défaut sur « 15 min »', () => {
    expect(reminderOptionOf(ReminderSettings.defaults())).toBe(15);
  });

  it('affiche un rappel désactivé sur « Aucun »', () => {
    expect(reminderOptionOf(ReminderSettings.disabled())).toBe(0);
  });

  it('transforme le choix en réglage', () => {
    expect(reminderSettingsFor(0).departureLead).toBeNull();
    expect(reminderSettingsFor(30).departureLead?.equals(Duration.ofMinutes(30))).toBe(true);
  });
});
