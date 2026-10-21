import { describe, expect, it } from 'vitest';

import { fromReminderSettingsRecord } from './reminder-settings-record';

describe('Réglage des rappels enregistré', () => {
  it('active la question à l’heure de départ pour un réglage enregistré avant son ajout', () => {
    expect(fromReminderSettingsRecord({ departureLeadMinutes: 5 }).atDeparture).toBe(true);
    expect(
      fromReminderSettingsRecord({ departureLeadMinutes: null, atDeparture: null }).atDeparture,
    ).toBe(true);
  });

  it('active la question de fin de semaine pour un réglage enregistré avant son ajout', () => {
    expect(fromReminderSettingsRecord({ departureLeadMinutes: 5 }).weekCheck).toBe(true);
    expect(
      fromReminderSettingsRecord({ departureLeadMinutes: null, weekCheck: null }).weekCheck,
    ).toBe(true);
  });

  it('respecte une question de fin de semaine désactivée', () => {
    expect(
      fromReminderSettingsRecord({ departureLeadMinutes: 5, weekCheck: false }).weekCheck,
    ).toBe(false);
  });

  it('suit la récup avec les délais par défaut pour un réglage enregistré avant son ajout', () => {
    const settings = fromReminderSettingsRecord({ departureLeadMinutes: 5 });

    expect([
      settings.approvalCheck,
      settings.approvalFirstDelayDays,
      settings.approvalRepeatDays,
    ]).toEqual([true, 2, 1]);
  });

  it('respecte une question désactivée', () => {
    expect(
      fromReminderSettingsRecord({ departureLeadMinutes: 5, atDeparture: false }).atDeparture,
    ).toBe(false);
  });
});
