import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import { ImpossiblePlanError } from '../domain/planning/impossible-plan-error';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../domain/shared/domain-error';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { TimeSlot } from '../domain/time/time-slot';
import { SimulatePlan, type FixedDay } from './simulate-plan';

const simulate = new SimulatePlan(laBrosseEtDupontRules());
const nextWeek = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map((iso) =>
  CalendarDate.fromIsoString(iso),
);
const friday = CalendarDate.fromIsoString('2026-10-23');

describe('SimulatePlan — cas d’usage de l’écran Simulation', () => {
  it('objectif d’heures : un plan daté pour chaque jour de la période', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'hours', target: Duration.ofHours(41) },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });

    expect(simulation.days.map((day) => day.date.toIsoString())).toEqual(
      nextWeek.map((d) => d.toIsoString()),
    );
    expect(simulation.days.every((day) => day.plan.worked.format() === '8h12')).toBe(true);
    expect(simulation.totalWorked.format()).toBe('41h');
  });

  it('applique le rythme choisi (rapide : lundi 10h)', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'hours', target: Duration.ofHours(39) },
      pace: 'fast',
      counter: HoursCounter.zero(),
    });

    expect(simulation.days.map((day) => day.plan.worked.format())).toEqual([
      '10h',
      '8h',
      '7h',
      '7h',
      '7h',
    ]);
  });

  it('compare les trois rythmes pour le même objectif', () => {
    const comparison = simulate.compare({
      days: nextWeek,
      objective: { kind: 'hours', target: Duration.ofHours(39) },
      counter: HoursCounter.zero(),
    });
    const workedOf = (pace: 'fast' | 'steady' | 'late'): string[] =>
      comparison[pace].days.map((day) => day.plan.worked.format());

    expect(workedOf('fast')).toEqual(['10h', '8h', '7h', '7h', '7h']);
    expect(workedOf('steady')).toEqual(['7h48', '7h48', '7h48', '7h48', '7h48']);
    expect(workedOf('late')).toEqual(['7h', '7h', '7h', '8h45', '9h15']);
  });

  it('objectif récup : planifie les jours avant la récup en tenant compte du compteur', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'recovery', date: friday, recovery: 'full' },
      pace: 'steady',
      counter: HoursCounter.of(Duration.ofHours(2, 15)),
    });

    expect(simulation.days.map((day) => day.date.toIsoString())).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
    ]);
    expect(simulation.totalWorked.format()).toBe('32h45');
  });

  it('objectif récup : le plan retient le jour et le type de récup (pour le solde à venir)', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'recovery', date: friday, recovery: 'half' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });

    expect(simulation.recovery?.date.toIsoString()).toBe('2026-10-23');
    expect(simulation.recovery?.kind).toBe('half');
    expect(simulation.recovery?.part).toBe('afternoon');
  });

  it('objectif demi-journée : le plan retient la moitié choisie (matin)', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'recovery', date: friday, recovery: 'half', part: 'morning' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });

    expect(simulation.recovery?.part).toBe('morning');
  });

  it('objectif journée complète : pas de moitié', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'recovery', date: friday, recovery: 'full', part: 'morning' },
      pace: 'steady',
      counter: HoursCounter.of(Duration.ofHours(7)),
    });

    expect(simulation.recovery?.part).toBeUndefined();
  });

  it('propose l’objectif restant de la semaine et le maximum (mercredi : 21h, max 28h)', () => {
    const suggestion = simulate.suggestObjective(null, nextWeek.slice(2), HoursCounter.zero());

    expect([suggestion?.remaining.format(), suggestion?.maximum.format()]).toEqual(['21h', '28h']);
  });

  it('dit si la journée d’aujourd’hui est finie (départ prévu passé)', () => {
    const plan = simulate.execute({
      days: nextWeek,
      objective: { kind: 'hours', target: Duration.ofHours(35) },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });
    const departure = plan.days[0]?.plan.departure ?? TimeOfDay.of(16, 0);

    expect(simulate.isDayOver(plan, nextWeek[0] ?? friday, departure)).toBe(true);
  });

  it('objectif d’heures : aucune récup dans le plan', () => {
    const simulation = simulate.execute({
      days: nextWeek,
      objective: { kind: 'hours', target: Duration.ofHours(35) },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });

    expect(simulation.recovery).toBeUndefined();
  });

  it('indique ce qu’il reste à faire avant la récup (récup moins compteur, jamais négatif)', () => {
    expect(simulate.hoursToCatchUp(HoursCounter.of(Duration.ofHours(2, 15)), 'full').format()).toBe(
      '4h45',
    );
    expect(simulate.hoursToCatchUp(HoursCounter.of(Duration.ofHours(9)), 'half').format()).toBe(
      '0h',
    );
  });

  describe('jours proposés pour la récup', () => {
    it('propose chaque jour sauf le premier, avec ce qu’il manque pour les jours impossibles', () => {
      // Avec -2h : mardi impossible (lundi à 10h ne donne que 3h sur les 5h nécessaires avec le découvert).
      const choices = simulate.recoveryChoices(
        nextWeek,
        HoursCounter.of(Duration.ofHours(-2)),
        'full',
      );

      expect(
        choices.map(({ date, outlook }) => [
          date.toIsoString(),
          outlook.reachable ? 'possible' : `manque ${outlook.missing.format()}`,
        ]),
      ).toEqual([
        ['2026-10-20', 'manque 2h'],
        ['2026-10-21', 'possible'],
        ['2026-10-22', 'possible'],
        ['2026-10-23', 'possible'],
      ]);
    });

    it('indique le découvert restant après une récup proche', () => {
      const [tuesday] = simulate.recoveryChoices(nextWeek, HoursCounter.zero(), 'full');

      expect(tuesday?.outlook).toEqual({
        reachable: true,
        catchUp: Duration.ofHours(3),
        deficitAfter: Duration.ofHours(4),
      });
    });

    it('ne propose rien sur une période d’un seul jour', () => {
      expect(simulate.recoveryChoices([friday], HoursCounter.zero(), 'full')).toEqual([]);
    });
  });

  it('refuse une récup le premier jour de la période (aucun jour pour la préparer)', () => {
    expect(() =>
      simulate.execute({
        days: nextWeek,
        objective: {
          kind: 'recovery',
          date: CalendarDate.fromIsoString('2026-10-19'),
          recovery: 'full',
        },
        pace: 'steady',
        counter: HoursCounter.zero(),
      }),
    ).toThrow(InvalidValueError);
  });

  it('laisse passer l’erreur d’objectif impossible, avec son message', () => {
    expect(() =>
      simulate.execute({
        days: nextWeek,
        objective: { kind: 'hours', target: Duration.ofHours(52) },
        pace: 'steady',
        counter: HoursCounter.zero(),
      }),
    ).toThrow(ImpossiblePlanError);
  });

  describe('effet sur le compteur', () => {
    const planOf = (hours: number, minutes = 0) =>
      simulate.execute({
        days: nextWeek,
        objective: { kind: 'hours', target: Duration.ofHours(hours, minutes) },
        pace: 'steady',
        counter: HoursCounter.zero(),
      });

    it('un plan de 33h55 sur la semaine retire 1h05 au compteur', () => {
      expect(simulate.counterEffect(planOf(33, 55)).format({ signed: true })).toBe('-1h05');
    });

    it('propose 35h pour ne rien perdre sur la semaine', () => {
      expect(simulate.targetWithoutLoss(nextWeek).format()).toBe('35h');
    });
  });

  describe('jours aux horaires choisis', () => {
    const monday = nextWeek[0];
    const lunch = TimeSlot.between(TimeOfDay.of(12, 15), TimeOfDay.of(13, 0));
    const request = (fixedDays: readonly FixedDay[]) => ({
      days: nextWeek,
      objective: { kind: 'hours' as const, target: Duration.ofHours(35) },
      counter: HoursCounter.zero(),
      fixedDays,
    });

    it('garde le lundi de 9h00 à 16h00 et répartit le reste, pour chaque rythme', () => {
      if (monday === undefined) {
        throw new Error('Semaine de test vide');
      }
      const comparison = simulate.compare(
        request([
          {
            date: monday,
            arrival: TimeOfDay.of(9, 0),
            lunchBreak: lunch,
            departure: TimeOfDay.of(16, 0),
          },
        ]),
      );

      expect(comparison.steady.days.map((day) => day.plan.worked.format())).toEqual([
        '6h15',
        '7h12',
        '7h11',
        '7h11',
        '7h11',
      ]);
      expect(comparison.fast.days[0]?.plan.arrival.format()).toBe('9h00');
      expect(comparison.late.totalWorked.format()).toBe('35h');
    });

    it('refuse un jour choisi hors de la période', () => {
      expect(() =>
        simulate.execute({
          ...request([
            {
              date: friday.plusDays(3),
              arrival: TimeOfDay.of(8, 0),
              lunchBreak: lunch,
              departure: TimeOfDay.of(16, 0),
            },
          ]),
          pace: 'steady',
        }),
      ).toThrow(InvalidValueError);
    });
  });
});
