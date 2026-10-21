import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { ReminderSettings } from './reminder-settings';

describe('ReminderSettings — réglage du rappel de départ', () => {
  it('par défaut, rappelle 15 min avant le départ et demande à l’heure de départ', () => {
    const settings = ReminderSettings.defaults();

    expect(settings.departureLead?.format()).toBe('0h15');
    expect(settings.atDeparture).toBe(true);
    expect(settings.weekCheck).toBe(true);
  });

  it('peut être entièrement désactivé', () => {
    const settings = ReminderSettings.disabled();

    expect(settings.departureLead).toBeNull();
    expect(settings.atDeparture).toBe(false);
    expect(settings.weekCheck).toBe(false);
  });

  it('règle séparément le rappel avant le départ et la question à l’heure de départ', () => {
    const settings = ReminderSettings.create({ departureLead: null, atDeparture: true });

    expect(settings.departureLead).toBeNull();
    expect(settings.atDeparture).toBe(true);
  });

  it('pose la question de fin de semaine sauf si elle est désactivée', () => {
    expect(ReminderSettings.create({ departureLead: null, atDeparture: false }).weekCheck).toBe(
      true,
    );
    expect(
      ReminderSettings.create({ departureLead: null, atDeparture: false, weekCheck: false })
        .weekCheck,
    ).toBe(false);
    expect(ReminderSettings.departureLead(Duration.ofMinutes(5)).weekCheck).toBe(true);
  });

  it('accepte un délai jusqu’à 2h', () => {
    expect(ReminderSettings.departureLead(Duration.ofHours(2)).departureLead?.format()).toBe('2h');
  });

  it.each([
    ['nul', Duration.zero()],
    ['négatif', Duration.ofMinutes(-5)],
    ['supérieur à 2h', Duration.ofMinutes(121)],
  ])('refuse un délai %s', (_case, lead) => {
    expect(() => ReminderSettings.departureLead(lead)).toThrow(InvalidValueError);
    expect(() => ReminderSettings.create({ departureLead: lead, atDeparture: false })).toThrow(
      InvalidValueError,
    );
  });
});
