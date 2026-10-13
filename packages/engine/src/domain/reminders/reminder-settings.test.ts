import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { ReminderSettings } from './reminder-settings';

describe('ReminderSettings — réglage du rappel de départ', () => {
  it('rappelle 15 min avant le départ par défaut', () => {
    expect(ReminderSettings.defaults().departureLead?.format()).toBe('0h15');
  });

  it('peut être désactivé', () => {
    expect(ReminderSettings.disabled().departureLead).toBeNull();
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
  });
});
