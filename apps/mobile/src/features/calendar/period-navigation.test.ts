import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  YearMonth,
  laBrosseEtDupontRules,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { monthNavigation, weekNavigation } from './period-navigation';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const simulate = new SimulatePlan(laBrosseEtDupontRules());

/** Plan de deux semaines ouvrées à partir du lundi donné, 82h au rythme régulier. */
const twoWeeksFrom = (monday: string): DatedPlan => {
  const start = date(monday);
  return simulate.execute({
    days: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11].map((offset) => start.plusDays(offset)),
    objective: { kind: 'hours', target: Duration.ofHours(82) },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });
};

describe('weekNavigation — semaines accessibles depuis la semaine affichée', () => {
  const plan = twoWeeksFrom('2026-10-19');

  it('propose la semaine suivante mais pas la précédente sur la première semaine du plan', () => {
    const navigation = weekNavigation(plan, date('2026-10-19'));

    expect(navigation.previous).toBeNull();
    expect(navigation.next?.toIsoString()).toBe('2026-10-26');
  });

  it('propose la semaine précédente mais pas la suivante sur la dernière semaine du plan', () => {
    const navigation = weekNavigation(plan, date('2026-10-26'));

    expect(navigation.previous?.toIsoString()).toBe('2026-10-19');
    expect(navigation.next).toBeNull();
  });

  it('ramène vers le plan quand la semaine affichée est avant son début', () => {
    const navigation = weekNavigation(plan, date('2026-10-12'));

    expect(navigation.previous).toBeNull();
    expect(navigation.next?.toIsoString()).toBe('2026-10-19');
  });
});

describe('navigation sans plan', () => {
  it('ne propose aucune période quand le plan est vide', () => {
    const empty: DatedPlan = { days: [], totalWorked: Duration.zero() };

    expect(weekNavigation(empty, date('2026-10-19'))).toEqual({ previous: null, next: null });
    expect(monthNavigation(empty, YearMonth.of(2026, 10))).toEqual({ previous: null, next: null });
  });
});

describe('monthNavigation — mois accessibles depuis le mois affiché', () => {
  it('ne propose rien quand tout le plan tient dans le mois', () => {
    const navigation = monthNavigation(twoWeeksFrom('2026-10-19'), YearMonth.of(2026, 10));

    expect(navigation).toEqual({ previous: null, next: null });
  });

  it('propose le mois voisin quand le plan déborde sur lui', () => {
    const plan = twoWeeksFrom('2026-09-28');

    expect(monthNavigation(plan, YearMonth.of(2026, 9)).next?.equals(YearMonth.of(2026, 10))).toBe(
      true,
    );
    expect(monthNavigation(plan, YearMonth.of(2026, 9)).previous).toBeNull();
    expect(
      monthNavigation(plan, YearMonth.of(2026, 10)).previous?.equals(YearMonth.of(2026, 9)),
    ).toBe(true);
    expect(monthNavigation(plan, YearMonth.of(2026, 10)).next).toBeNull();
  });
});
