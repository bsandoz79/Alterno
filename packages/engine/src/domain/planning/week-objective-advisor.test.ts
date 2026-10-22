import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { HoursCounter } from '../counter/hours-counter';
import {
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
} from '../rules/presets/la-brosse-et-dupont';
import { WorkRules } from '../rules/work-rules';
import { buildWorkRules } from '../rules/work-rules-settings';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { DatedPlan } from './dated-plan';
import { WeekObjectiveAdvisor } from './week-objective-advisor';

const advisor = new WeekObjectiveAdvisor(laBrosseEtDupontRules());
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const counter = (hours: number): HoursCounter => HoursCounter.of(Duration.ofHours(hours));
const dates = (...isos: string[]): readonly CalendarDate[] => isos.map(date);

/** Plan de test : départ à 17h00, temps travaillé donné par jour. */
const planOf = (days: readonly (readonly [string, number])[]): DatedPlan => ({
  days: days.map(([iso, hours]) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:30'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at('17:00'),
      worked: Duration.ofHours(hours),
    },
  })),
  totalWorked: Duration.ofHours(days.reduce((sum, [, hours]) => sum + hours, 0)),
});

/** Résumé lisible : fait, reste à faire, maximum. */
const describeSuggestion = (
  plan: DatedPlan | null,
  period: readonly CalendarDate[],
  balance: number,
  using = advisor,
): string => {
  const suggestion = using.suggest(plan, period, counter(balance));
  return suggestion === null
    ? 'rien'
    : `fait ${suggestion.done.format()}, reste ${suggestion.remaining.format()}, max ${suggestion.maximum.format()}`;
};

describe('WeekObjectiveAdvisor — objectif proposé selon ce qui est déjà fait', () => {
  it('mercredi soir : 3 × 7h déjà faites, reste 14h ; compteur 6h, plafond 7h → max 15h', () => {
    expect(describeSuggestion(null, dates('2026-10-22', '2026-10-23'), 6)).toBe(
      'fait 21h, reste 14h, max 15h',
    );
  });

  it('mercredi matin : 2 jours faits, reste 21h ; compteur 6h → max 22h (ton exemple)', () => {
    expect(describeSuggestion(null, dates('2026-10-21', '2026-10-22', '2026-10-23'), 6)).toBe(
      'fait 14h, reste 21h, max 22h',
    );
  });

  it('compte les heures réellement prévues ou déclarées les jours passés', () => {
    const plan = planOf([
      ['2026-10-19', 8],
      ['2026-10-20', 7.5],
    ]);

    expect(describeSuggestion(plan, dates('2026-10-21', '2026-10-22', '2026-10-23'), 0)).toBe(
      'fait 15h30, reste 19h30, max 26h30',
    );
  });

  it('semaine prochaine : rien de fait, 35h à faire', () => {
    expect(
      describeSuggestion(
        null,
        dates('2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'),
        0,
      ),
    ).toBe('fait 0h, reste 35h, max 42h');
  });

  it('cas limite : compteur déjà au plafond, le maximum est le reste à faire', () => {
    expect(describeSuggestion(null, dates('2026-10-22', '2026-10-23'), 9)).toBe(
      'fait 21h, reste 14h, max 14h',
    );
  });

  it('cas limite : le maximum ne dépasse pas les horaires (vendredi : 7h30–17h30, moins la pause)', () => {
    expect(describeSuggestion(null, dates('2026-10-23'), -20)).toBe('fait 28h, reste 7h, max 9h15');
  });

  it('cas limite : semaine déjà dépassée, plus rien à faire', () => {
    const plan = planOf([
      ['2026-10-19', 10],
      ['2026-10-20', 10],
      ['2026-10-21', 10],
      ['2026-10-22', 10],
    ]);

    expect(describeSuggestion(plan, dates('2026-10-23'), 0)).toBe('fait 40h, reste 0h, max 7h');
  });

  it('sans plafond de compteur, le maximum suit seulement les horaires', () => {
    const noCap = new WeekObjectiveAdvisor(
      buildWorkRules({ ...laBrosseEtDupontSettings(), maximumCredit: null }),
    );

    expect(describeSuggestion(null, dates('2026-10-23'), 0, noCap)).toBe(
      'fait 28h, reste 7h, max 9h15',
    );
  });

  it('ne compte pas les jours non travaillés de la semaine (lundi non travaillé)', () => {
    const preset = laBrosseEtDupontRules();
    const day = preset.scheduleFor('tuesday');
    const fourDays = new WeekObjectiveAdvisor(
      WorkRules.create({
        week: { tuesday: day, wednesday: day, thursday: day, friday: preset.scheduleFor('friday') },
        minimumLunchBreak: preset.minimumLunchBreak,
        expectedDailyWork: preset.expectedDailyWork,
        fullDayRecovery: preset.fullDayRecovery,
        halfDayRecovery: preset.halfDayRecovery,
      }),
    );

    expect(describeSuggestion(null, dates('2026-10-22', '2026-10-23'), 0, fourDays)).toBe(
      'fait 14h, reste 14h, max 19h15',
    );
  });

  describe('revenir à 0 quand le compteur est négatif', () => {
    const nextWeek = dates('2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30');
    const twoWeeks = [
      ...nextWeek,
      ...dates('2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'),
    ];
    const backToZero = (period: readonly CalendarDate[], balance: Duration): string | undefined =>
      advisor.suggest(null, period, HoursCounter.of(balance))?.backToZero?.format();

    it('à −1h, propose 36h sur une semaine', () => {
      expect(backToZero(nextWeek, Duration.ofHours(-1))).toBe('36h');
    });

    it('à −1h30, propose 71h30 sur deux semaines', () => {
      expect(backToZero(twoWeeks, Duration.ofHours(-1, -30))).toBe('71h30');
    });

    it('ne propose rien quand le compteur est à zéro ou positif', () => {
      expect(backToZero(nextWeek, Duration.zero())).toBeUndefined();
      expect(backToZero(nextWeek, Duration.ofHours(2))).toBeUndefined();
    });
  });

  it('ne propose rien sans jour à planifier', () => {
    expect(describeSuggestion(null, [], 0)).toBe('rien');
  });

  describe('isDayOver — la journée compte-t-elle comme faite ?', () => {
    const plan = planOf([['2026-10-21', 7]]);

    it('oui, une fois l’heure de départ prévue atteinte', () => {
      expect(advisor.isDayOver(plan, date('2026-10-21'), at('17:00'))).toBe(true);
    });

    it('non, avant l’heure de départ prévue', () => {
      expect(advisor.isDayOver(plan, date('2026-10-21'), at('16:59'))).toBe(false);
    });

    it('non, quand aujourd’hui n’est pas planifié', () => {
      expect(advisor.isDayOver(plan, date('2026-10-22'), at('20:00'))).toBe(false);
      expect(advisor.isDayOver(null, date('2026-10-21'), at('20:00'))).toBe(false);
    });
  });
});
