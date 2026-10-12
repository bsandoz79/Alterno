import {
  CalendarDate,
  Duration,
  HoursCounter,
  SchoolWeeks,
  SimulatePlan,
  laBrosseEtDupontRules,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { restOfWeek, todayStatus } from './today-view';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

/** Plan du 19 au 30 octobre (sauf le vendredi 23, récup), 72h au rythme régulier. */
const plan: DatedPlan = new SimulatePlan(laBrosseEtDupontRules()).execute({
  days: [
    '2026-10-19',
    '2026-10-20',
    '2026-10-21',
    '2026-10-22',
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
  ].map(date),
  objective: { kind: 'hours', target: Duration.ofHours(72) },
  pace: 'steady',
  counter: HoursCounter.zero(),
});
const noSchool = SchoolWeeks.none();

describe('todayStatus — ce qu’affiche l’accueil', () => {
  it('invite à faire une simulation quand aucun plan n’est validé', () => {
    expect(todayStatus(null, noSchool, date('2026-10-19'))).toEqual({ kind: 'no-plan' });
  });

  it('affiche le plan du jour quand aujourd’hui est planifié', () => {
    const status = todayStatus(plan, noSchool, date('2026-10-20'));

    expect(status.kind).toBe('work');
    expect(status.kind === 'work' && status.day.date.toIsoString()).toBe('2026-10-20');
  });

  it('signale une journée d’école', () => {
    const status = todayStatus(plan, SchoolWeeks.of([date('2026-11-02')]), date('2026-11-03'));

    expect(status.kind).toBe('school');
  });

  it('avant le début du plan : l’indique au lieu de dire « rien de prévu »', () => {
    const status = todayStatus(plan, noSchool, date('2026-10-12'));

    expect(status.kind).toBe('before-plan');
    expect(status.kind === 'before-plan' && status.first.date.toIsoString()).toBe('2026-10-19');
  });

  it('jour sans plan (récup, week-end) : annonce le prochain jour planifié', () => {
    const status = todayStatus(plan, noSchool, date('2026-10-23'));

    expect(status.kind).toBe('off');
    expect(status.kind === 'off' && status.next?.date.toIsoString()).toBe('2026-10-26');
  });

  it('plan terminé : plus de prochain jour', () => {
    const status = todayStatus(plan, noSchool, date('2026-11-09'));

    expect(status).toEqual({ kind: 'off', next: null });
  });
});

describe('restOfWeek — jours planifiés restants de la semaine', () => {
  it('liste les jours planifiés après aujourd’hui, jusqu’au vendredi', () => {
    expect(restOfWeek(plan, date('2026-10-20')).map((day) => day.date.toIsoString())).toEqual([
      '2026-10-21',
      '2026-10-22',
    ]);
  });

  it('ne déborde pas sur la semaine suivante', () => {
    expect(restOfWeek(plan, date('2026-10-22'))).toEqual([]);
  });
});
