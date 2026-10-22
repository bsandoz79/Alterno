import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  TimeOfDay,
  TimeSlot,
  laBrosseEtDupontRules,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { setDayTimes } from '@/shared/planning/edited-days';

import { isStretchable, previewWeekEdit, stretchGridHours, weekEditVerdict } from './week-edit';

const rules = laBrosseEtDupontRules();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const week = new SimulatePlan(rules).execute({
  days: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(35) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});
const times = (arrival: string, departure: string) => ({
  arrival: TimeOfDay.parse(arrival),
  lunchBreak: TimeSlot.between(TimeOfDay.parse('12:15'), TimeOfDay.parse('13:00')),
  departure: TimeOfDay.parse(departure),
});
const preview = (edits: ReturnType<typeof setDayTimes>, today = '2026-10-28') =>
  previewWeekEdit({ plan: week, today: date(today), edits, rules, preferences: {} });

describe('previewWeekEdit — aperçu de la semaine après avoir étiré des jours', () => {
  it('sans modification, renvoie le plan tel quel', () => {
    const result = preview({});

    expect(result.ok && result.plan).toBe(week);
  });

  it('jeudi étiré jusqu’à 17h45 : mercredi et vendredi se raccourcissent', () => {
    const result = preview(setDayTimes({}, date('2026-10-29'), times('08:00', '17:45')));

    expect(result.ok && result.plan.days.map((day) => day.plan.worked.format())).toEqual([
      '7h',
      '7h',
      '6h',
      '9h',
      '6h',
    ]);
  });

  it('vendredi seul raccourci : les horaires sont gardés, le plan finit sous l’objectif', () => {
    const result = preview(
      setDayTimes({}, date('2026-10-30'), times('09:00', '15:30')),
      '2026-10-30',
    );

    expect(result.ok && result.plan.totalWorked.format()).toBe('33h45');
  });

  it('signale une règle enfreinte (arrivée après le début de la plage fixe)', () => {
    const result = preview(
      setDayTimes({}, date('2026-10-30'), times('09:30', '15:30')),
      '2026-10-30',
    );

    expect(result.ok ? '' : result.error).toMatch(/vendredi/);
  });
});

describe('weekEditVerdict — le plan tient-il ?', () => {
  const edited = (hours: number, minutes = 0) => ({
    ...week,
    totalWorked: Duration.ofHours(hours, minutes),
  });

  it('même total : le plan tient', () => {
    expect(weekEditVerdict(week, edited(35))).toEqual({
      kind: 'success',
      text: 'Le plan tient : 35h, jours étirés compris.',
    });
  });

  it('plus que le plan : le surplus ira au compteur', () => {
    expect(weekEditVerdict(week, edited(36, 45)).text).toBe(
      '+1h45 au-delà du plan (36h45), pour ton compteur.',
    );
  });

  it('moins que le plan : le manque sera pris sur le compteur', () => {
    expect(weekEditVerdict(week, edited(33, 45)).text).toBe(
      '1h15 de moins que le plan (33h45), pris sur ton compteur.',
    );
  });
});

describe('isStretchable — quels jours peut-on étirer ?', () => {
  it('les jours planifiés à partir d’aujourd’hui, pas les jours passés', () => {
    expect(isStretchable(date('2026-10-28'), true, date('2026-10-28'))).toBe(true);
    expect(isStretchable(date('2026-10-27'), true, date('2026-10-28'))).toBe(false);
    expect(isStretchable(date('2026-10-29'), false, date('2026-10-28'))).toBe(false);
  });
});

describe('stretchGridHours — grille assez haute pour étirer', () => {
  it('de l’heure pleine avant l’arrivée au plus tôt à celle après le départ au plus tard', () => {
    expect(stretchGridHours(rules)).toEqual({ start: 7, end: 19 });
  });
});
