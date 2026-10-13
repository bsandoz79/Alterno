import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { HoursCounter } from '../counter/hours-counter';
import type { RecoveryKind } from '../counter/recovery-kind';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { BalanceForecaster } from './balance-forecaster';
import type { DatedPlan } from './dated-plan';

const forecaster = new BalanceForecaster(laBrosseEtDupontRules());
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const counterOf = (hours: number, minutes = 0): HoursCounter =>
  HoursCounter.of(Duration.ofHours(hours, minutes));

/** Plan de test : une journée par date, avec le temps travaillé donné (les horaires n'importent pas ici). */
const planOf = (
  days: readonly (readonly [string, number])[],
  recovery?: { readonly date: string; readonly kind: RecoveryKind },
): DatedPlan => {
  const dated = days.map(([iso, minutes]) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: TimeOfDay.parse('08:00'),
      lunchBreak: TimeSlot.between(TimeOfDay.parse('12:00'), TimeOfDay.parse('12:45')),
      departure: TimeOfDay.parse('17:00'),
      worked: Duration.ofMinutes(minutes),
    },
  }));
  return {
    days: dated,
    totalWorked: dated.reduce((sum, day) => sum.plus(day.plan.worked), Duration.zero()),
    ...(recovery === undefined
      ? {}
      : { recovery: { date: date(recovery.date), kind: recovery.kind } }),
  };
};

describe('BalanceForecaster — solde à la fin du plan en cours', () => {
  it('demi-journée de récup prévue avec +7h et des journées à 7h : il restera +3h30', () => {
    const plan = planOf(
      [
        ['2026-10-13', 420],
        ['2026-10-14', 420],
      ],
      { date: '2026-10-15', kind: 'half' },
    );

    const forecast = forecaster.forecast(counterOf(7), plan, date('2026-10-13'));

    expect(forecast?.balance.format()).toBe('+3h30');
    expect(forecast?.until.toIsoString()).toBe('2026-10-15');
    expect(forecast?.includesRecovery).toBe(true);
  });

  it('ajoute l’écart des journées restantes : 8h45 puis 8h45 donnent +3h30', () => {
    const plan = planOf([
      ['2026-10-13', 525],
      ['2026-10-14', 525],
    ]);

    const forecast = forecaster.forecast(HoursCounter.zero(), plan, date('2026-10-13'));

    expect(forecast?.balance.format()).toBe('+3h30');
    expect(forecast?.until.toIsoString()).toBe('2026-10-14');
    expect(forecast?.includesRecovery).toBe(false);
  });

  it('ne compte pas les jours passés : ils sont déjà dans le compteur', () => {
    const plan = planOf(
      [
        ['2026-10-12', 600],
        ['2026-10-13', 480],
      ],
      { date: '2026-10-14', kind: 'full' },
    );

    // Aujourd'hui mardi : seul mardi (+1h) et la récup (-7h) restent à venir.
    expect(forecaster.forecast(counterOf(9), plan, date('2026-10-13'))?.balance.format()).toBe(
      '+3h',
    );
  });

  it('récup à découvert : le solde à venir peut être négatif', () => {
    const plan = planOf([['2026-10-13', 600]], { date: '2026-10-14', kind: 'full' });

    expect(
      forecaster.forecast(HoursCounter.zero(), plan, date('2026-10-13'))?.balance.format(),
    ).toBe('-4h');
  });

  it('ne prévoit rien quand le plan est terminé', () => {
    const plan = planOf([['2026-10-12', 420]], { date: '2026-10-13', kind: 'full' });

    expect(forecaster.forecast(counterOf(2), plan, date('2026-10-14'))).toBeNull();
  });

  it('cas limite : jour de la récup = aujourd’hui, tous les jours travaillés sont passés', () => {
    const plan = planOf([['2026-10-12', 840]], { date: '2026-10-13', kind: 'full' });

    const forecast = forecaster.forecast(counterOf(7), plan, date('2026-10-13'));

    expect(forecast?.balance.format()).toBe('0h');
    expect(forecast?.until.toIsoString()).toBe('2026-10-13');
  });
});
