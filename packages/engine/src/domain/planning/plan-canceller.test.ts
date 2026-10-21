import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import { SchoolWeeks } from '../calendar/school-weeks';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { DatedPlan, PlannedRecovery } from './dated-plan';
import { PlanCanceller } from './plan-canceller';

const canceller = new PlanCanceller(laBrosseEtDupontRules());
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const noSchool = SchoolWeeks.none();

/** Plan de test : 8h par jour aux dates données (avance pour une récup), récup éventuelle. */
const planOf = (isos: readonly string[], recovery?: PlannedRecovery): DatedPlan => ({
  days: isos.map((iso) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:00'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at('16:45'),
      worked: Duration.ofHours(8),
    },
  })),
  totalWorked: Duration.ofHours(8 * isos.length),
  ...(recovery === undefined ? {} : { recovery }),
});

/** Résumé : chaque jour et son temps, puis le total et la récup. */
const describePlan = (plan: DatedPlan): string =>
  [
    ...plan.days.map((day) => `${day.date.toIsoString()} ${day.plan.worked.format()}`),
    `total ${plan.totalWorked.format()}`,
    plan.recovery === undefined ? 'sans récup' : `récup ${plan.recovery.date.toIsoString()}`,
  ].join(' | ');

const recoveryFriday: PlannedRecovery = { date: date('2026-10-23'), kind: 'full' };

describe('PlanCanceller — annuler un plan ou sa récup', () => {
  describe('annuler le plan à partir d’un jour', () => {
    it('garde les jours passés, remet des journées standard (7h) jusqu’à la fin de la semaine', () => {
      const plan = planOf(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'], recoveryFriday);

      expect(describePlan(canceller.cancelFrom(plan, date('2026-10-21'), noSchool))).toBe(
        '2026-10-19 8h | 2026-10-20 8h | 2026-10-21 7h | 2026-10-22 7h | 2026-10-23 7h | total 37h | sans récup',
      );
    });

    it('garde une récup déjà passée', () => {
      const plan = planOf(['2026-10-19', '2026-10-21'], { date: date('2026-10-20'), kind: 'full' });

      expect(describePlan(canceller.cancelFrom(plan, date('2026-10-22'), noSchool))).toBe(
        '2026-10-19 8h | 2026-10-21 8h | 2026-10-22 7h | 2026-10-23 7h | total 30h | récup 2026-10-20',
      );
    });

    it('cas limite : le week-end, il ne reste que les jours passés (la semaine standard reprendra)', () => {
      const plan = planOf(['2026-10-26', '2026-10-27'], { date: date('2026-10-30'), kind: 'full' });

      expect(describePlan(canceller.cancelFrom(plan, date('2026-10-24'), noSchool))).toBe(
        'total 0h | sans récup',
      );
    });

    it('cas limite : en semaine d’école, aucun jour standard', () => {
      const plan = planOf(['2026-10-19', '2026-10-20']);

      expect(
        describePlan(
          canceller.cancelFrom(plan, date('2026-10-21'), SchoolWeeks.of([date('2026-10-19')])),
        ),
      ).toBe('2026-10-19 8h | 2026-10-20 8h | total 16h | sans récup');
    });
  });

  describe('annuler seulement la récup', () => {
    it('le jour de récup redevient travaillé ; les jours restants repassent à 7h, les jours passés restent', () => {
      const plan = planOf(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'], recoveryFriday);

      expect(describePlan(canceller.cancelRecovery(plan, date('2026-10-21')))).toBe(
        '2026-10-19 8h | 2026-10-20 8h | 2026-10-21 7h | 2026-10-22 7h | 2026-10-23 7h | total 37h | sans récup',
      );
    });

    it('cas limite : annulée le jour même, la récup redevient une journée de 7h', () => {
      const plan = planOf(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'], recoveryFriday);

      expect(describePlan(canceller.cancelRecovery(plan, date('2026-10-23')))).toBe(
        '2026-10-19 8h | 2026-10-20 8h | 2026-10-21 8h | 2026-10-22 8h | 2026-10-23 7h | total 39h | sans récup',
      );
    });

    it('refuse une récup déjà passée', () => {
      const plan = planOf(['2026-10-19'], { date: date('2026-10-20'), kind: 'half' });

      expect(() => canceller.cancelRecovery(plan, date('2026-10-21'))).toThrow(InvalidValueError);
    });

    it('refuse un plan sans récup', () => {
      expect(() => canceller.cancelRecovery(planOf(['2026-10-21']), date('2026-10-21'))).toThrow(
        /pas de récup/,
      );
    });
  });
});
