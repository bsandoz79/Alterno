import {
  CalendarDate,
  Duration,
  HoursCounter,
  SchoolWeeks,
  SimulatePlan,
  TimeOfDay,
  TimeSlot,
  laBrosseEtDupontRules,
  type DatedPlan,
  type RecoveryDay,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { dayKind, gridHours, recoveryBlocks, selectWeek, weekAt } from './week-view';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const simulate = new SimulatePlan(laBrosseEtDupontRules());

/** Plan validé sur deux semaines (19 → 30 octobre), 82h au rythme régulier : 8h12 par jour, de 8h00 à 16h57. */
const twoWeeks: DatedPlan = simulate.execute({
  days: [
    '2026-10-19',
    '2026-10-20',
    '2026-10-21',
    '2026-10-22',
    '2026-10-23',
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
  ].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(82) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

describe('selectWeek — semaine affichée dans la grille', () => {
  it('affiche la semaine d’aujourd’hui si le plan la couvre', () => {
    const week = selectWeek(twoWeeks, date('2026-10-28'));

    expect(week.monday.toIsoString()).toBe('2026-10-26');
    expect(week.columns.map((column) => column.date.toIsoString())).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ]);
    expect(week.total.format()).toBe('41h');
  });

  it('affiche la semaine d’aujourd’hui même si le plan commence plus tard (semaine vide)', () => {
    const week = selectWeek(twoWeeks, date('2026-10-14'));

    expect(week.monday.toIsoString()).toBe('2026-10-12');
    expect(week.total.isZero()).toBe(true);
  });

  it('affiche la semaine d’aujourd’hui, pas l’ancienne, quand le plan est terminé', () => {
    expect(selectWeek(twoWeeks, date('2026-11-10')).monday.toIsoString()).toBe('2026-11-09');
  });

  it('marque le jour de récup du plan, et lui seul', () => {
    const withRecovery = simulate.execute({
      days: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map(date),
      objective: { kind: 'recovery', date: date('2026-10-23'), recovery: 'full' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });
    const friday = selectWeek(withRecovery, date('2026-10-19')).columns[4];

    expect(friday?.date.toIsoString()).toBe('2026-10-23');
    expect(friday?.day).toBeNull();
    expect(friday?.recovery).toBe('full');
    expect(selectWeek(withRecovery, date('2026-10-19')).columns[0]?.recovery).toBeNull();
  });
});

describe('weekAt — semaine choisie par la navigation', () => {
  it('affiche la semaine demandée, même si on lui donne un autre jour que le lundi', () => {
    const week = weekAt(twoWeeks, date('2026-10-21'));

    expect(week.monday.toIsoString()).toBe('2026-10-19');
    expect(week.total.format()).toBe('41h');
  });

  it('renvoie une semaine vide (total nul) hors du plan', () => {
    const week = weekAt(twoWeeks, date('2026-11-02'));

    expect(week.columns.every((column) => column.day === null)).toBe(true);
    expect(week.total.format()).toBe('0h');
  });
});

describe('gridHours — plage d’heures de la grille', () => {
  it('va de l’heure pleine avant la première arrivée à l’heure pleine après le dernier départ', () => {
    const week = selectWeek(twoWeeks, date('2026-10-19'));

    // Arrivées à 8h00, départs à 16h57 : grille de 8h à 17h.
    expect(gridHours(week)).toEqual({ start: 8, end: 17 });
  });
  it('garde une plage de 8h à 18h quand aucun jour de la semaine n’est planifié', () => {
    const emptyWeek = { monday: date('2026-10-19'), columns: [], total: Duration.zero() };

    expect(gridHours(emptyWeek)).toEqual({ start: 8, end: 18 });
  });
});

describe('recoveryBlocks — repos compensatoire dans la grille', () => {
  const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
  const afternoonOff: RecoveryDay = {
    kind: 'half',
    part: 'afternoon',
    worked: TimeSlot.between(at('09:00'), at('12:30')),
    rest: TimeSlot.between(at('12:30'), at('16:00')),
  };

  it('journée complète : un seul bloc « Repos compensatoire » sur toute la hauteur', () => {
    expect(recoveryBlocks({ kind: 'full' }, { start: 8, end: 17 })).toEqual([
      { kind: 'rest', label: 'Repos compensatoire', top: 0, height: 1 },
    ]);
  });

  it('demi-journée : la partie travaillée avec ses horaires, puis le repos avec les siens', () => {
    const blocks = recoveryBlocks(afternoonOff, { start: 8, end: 16 });

    expect(blocks.map((block) => [block.kind, block.label])).toEqual([
      ['work', '9h00 – 12h30'],
      ['rest', 'Repos compensatoire 12h30 – 16h00'],
    ]);
    expect(blocks[1]?.top).toBeCloseTo(4.5 / 8);
    expect(blocks[1]?.height).toBeCloseTo(3.5 / 8);
  });

  it('cas limite : la grille s’étend aux heures de la demi-journée de récup', () => {
    const morningOff: RecoveryDay = {
      kind: 'half',
      part: 'morning',
      worked: TimeSlot.between(at('12:00'), at('15:30')),
      rest: TimeSlot.between(at('07:30'), at('12:00')),
    };
    const withRecovery = simulate.execute({
      days: ['2026-10-19', '2026-10-20'].map(date),
      objective: { kind: 'recovery', date: date('2026-10-23'), recovery: 'half' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });
    const week = selectWeek(withRecovery, date('2026-10-19'));

    expect(gridHours(week, morningOff).start).toBe(7);
    expect(recoveryBlocks(morningOff, { start: 7, end: 16 }).map((block) => block.kind)).toEqual([
      'rest',
      'work',
    ]);
    // Sans récup dans la semaine affichée, les horaires de la récup sont ignorés.
    expect(gridHours(weekAt(withRecovery, date('2026-10-26')), morningOff)).toEqual({
      start: 8,
      end: 18,
    });
  });
});

describe('dayKind — ce qu’affiche la case d’un jour', () => {
  const schoolWeeks = SchoolWeeks.of([date('2026-11-02')]);

  it('affiche le travail prévu quand le jour est planifié', () => {
    const monday = weekAt(twoWeeks, date('2026-10-19')).columns[0];

    expect(monday && dayKind(monday, schoolWeeks)).toBe('work');
  });

  it('affiche « école » pour un jour sans plan d’une semaine d’école', () => {
    const monday = weekAt(twoWeeks, date('2026-11-02')).columns[0];

    expect(monday && dayKind(monday, schoolWeeks)).toBe('school');
  });

  it('n’affiche « récup » que le jour de récup du plan', () => {
    const recovery = { date: date('2026-11-13'), recovery: 'half' as const, day: null };

    expect(dayKind(recovery, schoolWeeks)).toBe('recovery');
  });

  it('n’affiche rien de particulier pour un autre jour sans plan', () => {
    const monday = weekAt(twoWeeks, date('2026-11-09')).columns[0];

    expect(monday && dayKind(monday, schoolWeeks)).toBe('none');
  });
});
