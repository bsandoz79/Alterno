import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { Notifier, ReminderDelivery } from '../domain/ports/notifier';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ReminderSettingsRepository } from '../domain/ports/reminder-settings-repository';
import type { ScheduledReminder } from '../domain/reminders/scheduled-reminder';
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
): Notifier & { scheduled: readonly ScheduledReminder[] | null } => {
  const notifier = {
    scheduled: null as readonly ScheduledReminder[] | null,
    replaceReminders: (reminders: readonly ScheduledReminder[]) => {
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
  it('programme, pour chaque jour à venir, le rappel avant le départ et la question à l’heure de départ, puis la question de fin de semaine', async () => {
    const notifier = memoryNotifier();
    const result = await new ScheduleDepartureReminders(
      plansWith(plan),
      settingsOf(ReminderSettings.defaults()),
      notifier,
      clock,
    ).execute();

    expect(result).toEqual({ count: 5, delivery: 'scheduled' });
    expect(
      notifier.scheduled?.map((reminder) => `${reminder.date.toIsoString()} ${reminder.kind}`),
    ).toEqual([
      '2026-10-19 before',
      '2026-10-19 at-departure',
      '2026-10-20 before',
      '2026-10-20 at-departure',
      '2026-10-20 week-check',
    ]);
  });

  it('ajoute la question de fin de semaine au dernier jour du plan', async () => {
    const notifier = memoryNotifier();
    const result = await new ScheduleDepartureReminders(
      plansWith(plan),
      settingsOf(ReminderSettings.create({ departureLead: null, atDeparture: false })),
      notifier,
      clock,
    ).execute();

    expect(result.count).toBe(1);
    expect(
      notifier.scheduled?.map((reminder) => `${reminder.date.toIsoString()} ${reminder.kind}`),
    ).toEqual(['2026-10-20 week-check']);
  });

  it('ajoute les questions de suivi de la récup demandée', async () => {
    const notifier = memoryNotifier();
    const withRecovery: DatedPlan = {
      ...plan,
      recovery: {
        date: date('2026-10-23'),
        kind: 'full',
        approval: {
          status: 'pending',
          requestedOn: date('2026-10-19'),
          requestedAt: TimeOfDay.of(9, 0),
        },
      },
    };
    await new ScheduleDepartureReminders(
      plansWith(withRecovery),
      settingsOf(
        ReminderSettings.create({ departureLead: null, atDeparture: false, weekCheck: false }),
      ),
      notifier,
      clock,
    ).execute();

    expect(
      notifier.scheduled?.map((reminder) => `${reminder.date.toIsoString()} ${reminder.kind}`),
    ).toEqual(['2026-10-21 recovery-approval', '2026-10-22 recovery-approval']);
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
