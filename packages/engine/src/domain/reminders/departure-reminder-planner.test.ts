import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan } from '../planning/dated-plan';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { DepartureReminderPlanner } from './departure-reminder-planner';
import { ReminderSettings } from './reminder-settings';

const planner = new DepartureReminderPlanner();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
/** Rappel 15 min avant seulement (sans la question à l'heure de départ). */
const lead15 = ReminderSettings.create({
  departureLead: Duration.ofMinutes(15),
  atDeparture: false,
});

/** Plan de test : une journée par date, avec son heure de départ. */
const planOf = (days: readonly (readonly [string, string])[]): DatedPlan => ({
  days: days.map(([iso, departure]) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:30'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at(departure),
      worked: Duration.ofHours(7),
    },
  })),
  totalWorked: Duration.ofHours(7 * days.length),
});

const describeReminders = (plan: DatedPlan, today: string, now: string, settings = lead15) =>
  planner
    .remindersFor(plan, { today: date(today), now: at(now) }, settings)
    .map(
      (reminder) =>
        `${reminder.date.toIsoString()} ${reminder.at.format()} → ${reminder.departure.format()}${
          reminder.kind === 'at-departure' ? ' (question)' : ''
        }`,
    );

describe('DepartureReminderPlanner — rappels avant l’heure de départ', () => {
  const week = planOf([
    ['2026-10-12', '16:30'],
    ['2026-10-13', '17:15'],
    ['2026-10-14', '18:15'],
  ]);

  it('programme un rappel 15 min avant chaque départ à venir', () => {
    expect(describeReminders(week, '2026-10-13', '09:00')).toEqual([
      '2026-10-13 17h00 → 17h15',
      '2026-10-14 18h00 → 18h15',
    ]);
  });

  it('ignore les jours passés et un rappel d’aujourd’hui déjà dépassé', () => {
    expect(describeReminders(week, '2026-10-13', '17:00')).toEqual(['2026-10-14 18h00 → 18h15']);
  });

  it('cas limite : le rappel d’aujourd’hui à la minute près est encore programmé', () => {
    expect(describeReminders(week, '2026-10-13', '16:59')).toHaveLength(2);
  });

  it('applique le délai choisi (30 min)', () => {
    const settings = ReminderSettings.create({
      departureLead: Duration.ofMinutes(30),
      atDeparture: false,
    });

    expect(describeReminders(week, '2026-10-14', '08:00', settings)).toEqual([
      '2026-10-14 17h45 → 18h15',
    ]);
  });

  it('ne programme rien quand le rappel est désactivé', () => {
    expect(describeReminders(week, '2026-10-13', '09:00', ReminderSettings.disabled())).toEqual([]);
  });

  it('ignore un départ trop tôt pour être précédé du délai (avant minuit)', () => {
    const settings = ReminderSettings.create({
      departureLead: Duration.ofHours(2),
      atDeparture: false,
    });
    const early = planOf([['2026-10-14', '01:00']]);

    expect(describeReminders(early, '2026-10-13', '09:00', settings)).toEqual([]);
  });

  describe('question à l’heure de départ (« tu pars plus tard ? »)', () => {
    it('ajoute, après chaque rappel, une notification à l’heure de départ', () => {
      expect(describeReminders(week, '2026-10-14', '08:00', ReminderSettings.defaults())).toEqual([
        '2026-10-14 18h00 → 18h15',
        '2026-10-14 18h15 → 18h15 (question)',
      ]);
    });

    it('peut être la seule notification, sans rappel avant', () => {
      const settings = ReminderSettings.create({ departureLead: null, atDeparture: true });

      expect(describeReminders(week, '2026-10-14', '08:00', settings)).toEqual([
        '2026-10-14 18h15 → 18h15 (question)',
      ]);
    });

    it('cas limite : garde la question du jour même si le rappel avant est déjà passé', () => {
      expect(describeReminders(week, '2026-10-14', '18:05', ReminderSettings.defaults())).toEqual([
        '2026-10-14 18h15 → 18h15 (question)',
      ]);
    });
  });
});
