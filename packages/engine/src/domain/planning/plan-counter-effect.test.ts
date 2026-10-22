import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan } from './dated-plan';
import { PlanGenerator } from './plan-generator';
import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { Duration } from '../time/duration';
import { PlanCounterEffect } from './plan-counter-effect';

const rules = laBrosseEtDupontRules();
const effect = new PlanCounterEffect(rules);
const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const MONDAY = CalendarDate.fromIsoString('2026-10-26');

/** Plan daté de la semaine du 26 octobre pour un objectif donné. */
const weekOf = (hours: number, minutes = 0): DatedPlan => {
  const plan = new PlanGenerator(rules).planForTotalHours(WEEK, Duration.ofHours(hours, minutes));
  return {
    days: plan.days.map((day, index) => ({ date: MONDAY.plusDays(index), plan: day })),
    totalWorked: plan.totalWorked,
  };
};

describe('PlanCounterEffect — effet d’un plan sur le compteur', () => {
  it('35h sur 5 jours : aucun effet (7h attendues par jour)', () => {
    expect(effect.of(weekOf(35)).isZero()).toBe(true);
  });

  it('33h55 sur 5 jours : retire 1h05 au compteur', () => {
    expect(effect.of(weekOf(33, 55)).format({ signed: true })).toBe('-1h05');
  });

  it('38h sur 5 jours : ajoute 3h au compteur', () => {
    expect(effect.of(weekOf(38)).format({ signed: true })).toBe('+3h');
  });

  it('objectif sans perte : 7h par jour, soit 35h sur 5 jours et 21h sur 3', () => {
    expect(effect.targetWithoutLoss(5).format()).toBe('35h');
    expect(effect.targetWithoutLoss(3).format()).toBe('21h');
  });
});
