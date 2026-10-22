import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  laBrosseEtDupontRules,
  type DatedDay,
  type DatedPlan,
  type PlanningPreferences,
  TimeOfDay,
  TimeSlot,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { dayEditFormFrom, isOutOfReach, previewDayEdit, type DayEditForm } from './day-edit-form';

const rules = laBrosseEtDupontRules();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

/** Semaine du 19 octobre, 41h au rythme régulier : 8h12 par jour, de 8h00 à 16h57. */
const week: DatedPlan = new SimulatePlan(rules).execute({
  days: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(41) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

const mondayOf = (plan: DatedPlan): DatedDay => {
  const [monday] = plan.days;
  if (monday === undefined) {
    throw new Error('Plan de test vide');
  }
  return monday;
};

const preview = (changes: Partial<DayEditForm>) =>
  previewDayEdit({
    plan: week,
    date: date('2026-10-19'),
    form: { ...dayEditFormFrom(mondayOf(week).plan), ...changes },
    rules,
    preferences: {},
  });

describe('dayEditFormFrom — formulaire pré-rempli avec le plan du jour', () => {
  it('reprend les horaires prévus et propose le rythme régulier', () => {
    expect(dayEditFormFrom(mondayOf(week).plan)).toEqual({
      arrival: '8h00',
      lunchStart: '12h15',
      lunchEnd: '13h00',
      departure: '16h57',
      pace: 'steady',
      arrivalChoice: 'recalculated',
      chosenArrival: '',
    });
  });
});

describe('isOutOfReach — le plan devient-il irréalisable ?', () => {
  it('oui quand le départ du lundi à 9h07 ne peut plus être rattrapé sur la semaine', () => {
    expect(isOutOfReach(preview({ departure: '9h07' }))).toBe(true);
  });

  it('non pour un petit écart rattrapable, ni pour une saisie invalide', () => {
    expect(isOutOfReach(preview({ departure: '16h07' }))).toBe(false);
    expect(isOutOfReach(preview({ departure: 'midi' }))).toBe(false);
  });
});

describe('previewDayEdit — aperçu du recalcul avant enregistrement', () => {
  it('parti à 16h07 : écart de -0h50 et jours suivants rallongés', () => {
    const result = preview({ departure: '16h07' });
    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.outcome.gap.format({ signed: true })).toBe('-0h50');
    expect(
      result.recalculated.map(
        (day) => `${day.date.toIsoString()} ${day.before.format()} → ${day.after.worked.format()}`,
      ),
    ).toEqual([
      '2026-10-20 8h12 → 8h25',
      '2026-10-21 8h12 → 8h25',
      '2026-10-22 8h12 → 8h24',
      '2026-10-23 8h12 → 8h24',
    ]);
  });

  it('ne liste aucun jour recalculé quand rien ne change', () => {
    const result = preview({});

    expect(result.ok && result.recalculated).toEqual([]);
  });

  it('applique le rythme choisi', () => {
    const result = preview({ departure: '16h07', pace: 'fast' });

    expect(result.ok && result.recalculated[0]?.after.worked.format()).toBe('10h');
  });

  it('nomme le champ quand une heure est illisible', () => {
    expect(preview({ departure: 'abc' })).toEqual({
      ok: false,
      error: 'Départ : « abc » n’est pas une heure valide (ex. 16h30).',
    });
  });

  it('refuse une pause qui finit avant de commencer', () => {
    const result = preview({ lunchStart: '13h00', lunchEnd: '12h00' });

    expect(result.ok).toBe(false);
  });

  it('refuse un départ avant l’arrivée', () => {
    const result = preview({ arrival: '17h00', departure: '16h00' });

    expect(result.ok).toBe(false);
  });
});

describe('previewDayEdit — garder son heure d’arrivée quand le recalcul la repousse', () => {
  const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
  const preferences: PlanningPreferences = {
    defaults: { arrival: at('08:20'), lunchBreak: TimeSlot.between(at('12:15'), at('13:00')) },
  };
  // Cas vécu : 21h du mercredi au vendredi, parti à 17h15 le mercredi.
  const short = new SimulatePlan(rules, preferences).execute({
    days: ['2026-10-21', '2026-10-22', '2026-10-23'].map(date),
    objective: { kind: 'hours', target: Duration.ofHours(21) },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });
  const leftLate = (changes: Partial<DayEditForm>) =>
    previewDayEdit({
      plan: short,
      date: date('2026-10-21'),
      form: { ...dayEditFormFrom(mondayOf(short).plan), departure: '17h15', ...changes },
      rules,
      preferences,
    });
  const okOf = (result: ReturnType<typeof leftLate>) => {
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  };

  it('signale le jeudi (8h50 au lieu de 8h20) sans rien changer par défaut', () => {
    const result = okOf(leftLate({}));

    expect(result.outcome.lateArrivals.map((late) => late.planned.format())).toEqual(['8h50']);
    expect(result.extra.format()).toBe('0h');
    expect(result.arrivalError).toBeNull();
  });

  it('garde 8h20 : 30 min de plus que l’objectif', () => {
    const result = okOf(leftLate({ arrivalChoice: 'preferred' }));

    expect(result.outcome.plan.days[1]?.plan.arrival.format()).toBe('8h20');
    expect(result.extra.format()).toBe('0h30');
  });

  it('heure choisie 8h30 : 20 min de plus', () => {
    const result = okOf(leftLate({ arrivalChoice: 'chosen', chosenArrival: '8h30' }));

    expect(result.extra.format()).toBe('0h20');
  });

  it('heure choisie illisible ou hors plage : le recalcul reste affiché avec un message', () => {
    const unreadable = okOf(leftLate({ arrivalChoice: 'chosen', chosenArrival: 'tôt' }));
    const tooEarly = okOf(leftLate({ arrivalChoice: 'chosen', chosenArrival: '7h00' }));

    expect(unreadable.arrivalError).toMatch(/Arrivée choisie.*tôt/);
    expect(unreadable.outcome.plan.days[1]?.plan.arrival.format()).toBe('8h50');
    expect(tooEarly.arrivalError).toMatch(/jeudi.*7h00/);
  });
});
