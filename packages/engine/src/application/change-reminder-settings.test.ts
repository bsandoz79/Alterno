import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import type { Clock } from '../domain/ports/clock';
import type { Notifier } from '../domain/ports/notifier';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import { ReminderSettings } from '../domain/reminders/reminder-settings';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { ChangeReminderSettings } from './change-reminder-settings';
import { ScheduleDepartureReminders } from './schedule-departure-reminders';

/** Dépôt du réglage en mémoire. */
const memorySettings = (): ReminderSettingsRepository & { current: ReminderSettings } => {
  const repository = {
    current: ReminderSettings.defaults(),
    load: () => Promise.resolve(repository.current),
    save: (settings: ReminderSettings) => {
      repository.current = settings;
      return Promise.resolve();
    },
  };
  return repository;
};
const noPlan: PlanRepository = {
  loadCurrent: () => Promise.resolve(null),
  saveCurrent: () => Promise.resolve(),
};
const clock: Clock = {
  today: () => CalendarDate.fromIsoString('2026-10-19'),
  currentTime: () => TimeOfDay.of(9, 0),
};
const unsupported: Notifier = { replaceDepartureReminders: () => Promise.resolve('unsupported') };

describe('ChangeReminderSettings — valider le réglage du rappel', () => {
  it('enregistre le réglage puis reprogramme les rappels, et dit ce qu’il en est', async () => {
    const settings = memorySettings();
    const change = new ChangeReminderSettings(
      settings,
      new ScheduleDepartureReminders(noPlan, settings, unsupported, clock),
    );

    const result = await change.execute(ReminderSettings.departureLead(Duration.ofMinutes(5)));

    expect(settings.current.departureLead?.format()).toBe('0h05');
    expect(result).toEqual({ count: 0, delivery: 'unsupported' });
  });
});
