import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../../rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../../shared/domain-error';
import { Duration } from '../../time/duration';
import { TimeOfDay } from '../../time/time-of-day';
import { TimeSlot } from '../../time/time-slot';
import { PlanValidator } from '../../validation/plan-validator';
import type { Plan } from '../plan';
import { PlanGenerator } from '../plan-generator';
import type { PlanningPreferences } from '../planning-preferences';
import { ArrivalKeeper } from './arrival-keeper';
import { DeviationReplanner } from './deviation-replanner';

const rules = laBrosseEtDupontRules();
const validator = new PlanValidator(rules);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const preferences: PlanningPreferences = {
  defaults: { arrival: at('08:20'), lunchBreak: TimeSlot.between(at('12:15'), at('13:00')) },
};
const keeper = new ArrivalKeeper(rules, preferences);

/**
 * Cas vécu : plan de 21h du mercredi au vendredi, parti à 17h15 le mercredi (8h10).
 * Le recalcul met le jeudi à 6h25 : départ à 16h00 (fin de la plage fixe), donc arrivée à 8h50.
 */
const replanned = (): Plan => {
  const plan = new PlanGenerator(rules, preferences).planForTotalHours(
    ['wednesday', 'thursday', 'friday'],
    Duration.ofHours(21),
  );
  return new DeviationReplanner(rules, preferences).replan(plan, 0, {
    arrival: at('08:20'),
    lunchBreak: TimeSlot.between(at('12:15'), at('13:00')),
    departure: at('17:15'),
  }).plan;
};

describe('ArrivalKeeper — garder l’heure d’arrivée préférée après un recalcul', () => {
  it('repère le jeudi : arrivée recalculée à 8h50 au lieu de 8h20', () => {
    const late = keeper.lateArrivals(replanned(), 1);

    expect(late).toHaveLength(1);
    expect(late[0]?.index).toBe(1);
    expect(late[0]?.planned.format()).toBe('8h50');
    expect(late[0]?.preferred.format()).toBe('8h20');
  });

  it('ignore les jours avant le point de départ', () => {
    expect(keeper.lateArrivals(replanned(), 2)).toEqual([]);
  });

  it('garde 8h20 le jeudi : départ inchangé à 16h00, 6h55 et 30 min de plus sur le plan', () => {
    const plan = replanned();
    const kept = keeper.keep(plan, [1], { kind: 'preferred' });
    const thursday = kept.days[1];
    if (thursday === undefined) {
      throw new Error('Jeudi absent du plan de test');
    }

    expect(thursday.arrival.format()).toBe('8h20');
    expect(thursday.departure.format()).toBe('16h00');
    expect(thursday.worked.format()).toBe('6h55');
    expect(kept.totalWorked.minus(plan.totalWorked).format()).toBe('0h30');
    expect(validator.validate('thursday', thursday).violations).toEqual([]);
  });

  it('arrivée choisie à 8h30 : 6h45 le jeudi, 20 min de plus', () => {
    const plan = replanned();
    const kept = keeper.keep(plan, [1], { kind: 'chosen', arrival: at('08:30') });

    expect(kept.days[1]?.worked.format()).toBe('6h45');
    expect(kept.totalWorked.minus(plan.totalWorked).format()).toBe('0h20');
  });

  it('ne touche pas aux autres jours', () => {
    const plan = replanned();
    const kept = keeper.keep(plan, [1], { kind: 'preferred' });

    expect(kept.days[0]).toEqual(plan.days[0]);
    expect(kept.days[2]).toEqual(plan.days[2]);
  });

  it('refuse une arrivée choisie hors de la plage d’arrivée', () => {
    const keepAt = (value: string): Plan =>
      keeper.keep(replanned(), [1], { kind: 'chosen', arrival: at(value) });

    expect(() => keepAt('07:00')).toThrow(InvalidValueError);
    expect(() => keepAt('07:00')).toThrow(/jeudi.*7h00/);
    expect(() => keepAt('09:15')).toThrow(/jeudi.*9h15/);
  });

  it('respecte l’arrivée au plus tôt choisie pour le jour', () => {
    const strict = new ArrivalKeeper(rules, {
      ...preferences,
      days: { thursday: { earliestArrival: at('08:10') } },
    });

    expect(() => strict.keep(replanned(), [1], { kind: 'chosen', arrival: at('08:00') })).toThrow(
      /jeudi.*8h00/,
    );
  });

  it('refuse un jour qui n’existe pas dans le plan', () => {
    expect(() => keeper.keep(replanned(), [5], { kind: 'preferred' })).toThrow(InvalidValueError);
  });
});
