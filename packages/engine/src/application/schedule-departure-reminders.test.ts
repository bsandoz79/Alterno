import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { Notifier, ReminderDelivery } from '../domain/ports/notifier';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import type { DepartureReminder } from '../domain/reminders/departure-reminder-planner';
import { ReminderSettings } from '../domain/reminders/reminder-settings';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { ScheduleDepartureReminders } from './schedule-departure-reminders';
import { SimulatePlan } from './simulate-plan';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const clock: Clock = { today: () => date('2026-10-19'), currentTime: () => TimeOfDay.of(9, 0) };
const plansWith = (plan: DatedPlan | null): PlanRepository => ({
  loadCurrent: () => Promise.resolve(plan),
  saveCurrent: () => Promise.resolve(),
});
const settingsOf = (settings: ReminderSettings): ReminderSettingsRepository => ({
  load: () => Promise.resolve(settings),
  save: () => Promise.resolve(),
});
/** Notificateur en mémoire : garde les derniers rappels programmés. */
const memoryNotifier = (
  delivery: ReminderDelivery = 'scheduled',
): Notifier & { scheduled: readonly DepartureReminder[] | null } => {
  const notifier = {
    scheduled: null as readonly DepartureReminder[] | null,
    replaceDepartureReminders: (reminders: readonly DepartureReminder[]) => {
      notifier.scheduled = reminders;
      return Promise.resolve(delivery);
    },
  };
  return notifier;
};

const plan = new SimulatePlan(laBrosseEtDupontRules()).execute({
  days: ['2026-10-19', '2026-10-20'].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(14) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

describe('ScheduleDepartureReminders — reprogrammer les rappels de départ', () => {
  it('programme un rappel par jour à venir du plan en cours', async () => {
    const notifier = memoryNotifier();
    const result = await new ScheduleDepartureReminders(
      plansWith(plan),
      settingsOf(ReminderSettings.defaults()),
      notifier,
      clock,
    ).execute();

    expect(result).toEqual({ count: 2, delivery: 'scheduled' });
    expect(notifier.scheduled?.map((reminder) => reminder.date.toIsoString())).toEqual([
      '2026-10-19',
      '2026-10-20',
    ]);
  });

  it('annule les rappels quand il n’y a pas de plan en cours', async () => {
    const notifier = memoryNotifier();
    await new ScheduleDepartureReminders(
      plansWith(null),
      settingsOf(ReminderSettings.defaults()),
      notifier,
      clock,
    ).execute();

    expect(notifier.scheduled).toEqual([]);
  });

  it('annule les rappels quand ils sont désactivés', async () => {
    const notifier = memoryNotifier();
    await new ScheduleDepartureReminders(
      plansWith(plan),
      settingsOf(ReminderSettings.disabled()),
      notifier,
      clock,
    ).execute();

    expect(notifier.scheduled).toEqual([]);
  });

  it('signale que le téléphone refuse les notifications', async () => {
    const result = await new ScheduleDepartureReminders(
      plansWith(plan),
      settingsOf(ReminderSettings.defaults()),
      memoryNotifier('not-allowed'),
      clock,
    ).execute();

    expect(result.delivery).toBe('not-allowed');
  });
});
