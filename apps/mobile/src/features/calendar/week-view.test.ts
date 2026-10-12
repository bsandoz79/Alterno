import {
  CalendarDate,
  Duration,
  HoursCounter,
  SimulatePlan,
  laBrosseEtDupontRules,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { dayBlocks, gridHours, selectWeek, weekAt } from './week-view';

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

  it('affiche la première semaine à venir si le plan commence plus tard', () => {
    expect(selectWeek(twoWeeks, date('2026-10-14')).monday.toIsoString()).toBe('2026-10-19');
  });

  it('affiche la dernière semaine si le plan est terminé', () => {
    expect(selectWeek(twoWeeks, date('2026-11-10')).monday.toIsoString()).toBe('2026-10-26');
  });

  it('laisse vide un jour sans plan (jour de récup)', () => {
    const withRecovery = simulate.execute({
      days: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map(date),
      objective: { kind: 'recovery', date: date('2026-10-23'), recovery: 'full' },
      pace: 'steady',
      counter: HoursCounter.zero(),
    });
    const friday = selectWeek(withRecovery, date('2026-10-19')).columns[4];

    expect(friday?.date.toIsoString()).toBe('2026-10-23');
    expect(friday?.day).toBeNull();
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

describe('dayBlocks — blocs d’une journée dans la grille', () => {
  it('découpe la journée en matin, pause et après-midi, positionnés en proportion de la grille', () => {
    const week = selectWeek(twoWeeks, date('2026-10-19'));
    const monday = week.columns[0]?.day;
    if (monday === null || monday === undefined) {
      throw new Error('Lundi absent du plan de test');
    }
    const blocks = dayBlocks(monday.plan, { start: 8, end: 17 });

    expect(blocks.map((block) => block.kind)).toEqual(['work', 'lunch', 'work']);
    expect(blocks[0]).toMatchObject({ label: '8h00 – 12h15', top: 0 });
    expect(blocks[0]?.height).toBeCloseTo(4.25 / 9);
    expect(blocks[1]).toMatchObject({ label: '12h15 – 13h00' });
    expect(blocks[1]?.top).toBeCloseTo(4.25 / 9);
  });
});
