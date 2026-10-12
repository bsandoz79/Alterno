import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../shared/domain-error';
import { CalendarDate } from './calendar-date';
import { planningPeriodDays } from './planning-period';

const rules = laBrosseEtDupontRules();
const wednesday = CalendarDate.fromIsoString('2026-10-14');
const isoDays = (days: readonly CalendarDate[]): string[] => days.map((day) => day.toIsoString());

describe('planningPeriodDays — jours travaillés d’une période de simulation', () => {
  it('semaine prochaine, 1 semaine : du lundi au vendredi suivants', () => {
    expect(
      isoDays(planningPeriodDays({ today: wednesday, start: 'next-week', weeks: 1, rules })),
    ).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);
  });

  it('semaine prochaine, 2 semaines : 10 jours, sans les week-ends', () => {
    const days = planningPeriodDays({ today: wednesday, start: 'next-week', weeks: 2, rules });

    expect(days).toHaveLength(10);
    expect(days.at(-1)?.toIsoString()).toBe('2026-10-30');
  });

  it('1 mois : 4 semaines, soit 20 jours travaillés', () => {
    expect(
      planningPeriodDays({ today: wednesday, start: 'next-week', weeks: 4, rules }),
    ).toHaveLength(20);
  });

  it('cette semaine : à partir d’aujourd’hui jusqu’au vendredi', () => {
    expect(
      isoDays(planningPeriodDays({ today: wednesday, start: 'this-week', weeks: 1, rules })),
    ).toEqual(['2026-10-14', '2026-10-15', '2026-10-16']);
  });

  it('cette semaine sur 2 semaines : jours restants puis la semaine suivante complète', () => {
    expect(
      planningPeriodDays({ today: wednesday, start: 'this-week', weeks: 2, rules }),
    ).toHaveLength(8);
  });

  it('refuse « cette semaine » le week-end, quand plus aucun jour n’est travaillé', () => {
    const saturday = CalendarDate.fromIsoString('2026-10-17');

    expect(() =>
      planningPeriodDays({ today: saturday, start: 'this-week', weeks: 1, rules }),
    ).toThrow(/semaine prochaine/);
  });

  it('refuse une durée nulle', () => {
    expect(() =>
      planningPeriodDays({ today: wednesday, start: 'next-week', weeks: 0, rules }),
    ).toThrow(InvalidValueError);
  });
});
