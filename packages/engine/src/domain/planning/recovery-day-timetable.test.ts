import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import {
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
} from '../rules/presets/la-brosse-et-dupont';
import { buildWorkRules } from '../rules/work-rules-settings';
import { Duration } from '../time/duration';
import type { PlannedRecovery } from './dated-plan';
import { RecoveryDayTimetable, type RecoveryDay } from './recovery-day-timetable';

const timetable = new RecoveryDayTimetable(laBrosseEtDupontRules());
const thursday = CalendarDate.fromIsoString('2026-10-22');
const friday = CalendarDate.fromIsoString('2026-10-23');

/** Horaires lisibles : « travail 9h00–12h30, repos 12h30–16h00 ». */
const describeDay = (day: RecoveryDay): string =>
  day.kind === 'full'
    ? 'journée de repos'
    : `travail ${day.worked.start.format()}–${day.worked.end.format()}, repos ${day.rest.start.format()}–${day.rest.end.format()}`;

const half = (date: CalendarDate, part?: PlannedRecovery['part']): PlannedRecovery => ({
  date,
  kind: 'half',
  ...(part === undefined ? {} : { part }),
});

describe('RecoveryDayTimetable — horaires d’un jour de repos compensatoire', () => {
  it('journée complète : toute la journée est en repos', () => {
    expect(describeDay(timetable.dayOf({ date: thursday, kind: 'full' }))).toBe('journée de repos');
  });

  it('après-midi de repos : 3h30 de travail dès 9h, puis 3h30 de repos (12h30–16h00)', () => {
    expect(describeDay(timetable.dayOf(half(thursday, 'afternoon')))).toBe(
      'travail 9h00–12h30, repos 12h30–16h00',
    );
  });

  it('matin de repos : 3h30 de repos, puis 3h30 de travail jusqu’à la fin de la plage fixe (16h)', () => {
    expect(describeDay(timetable.dayOf(half(thursday, 'morning')))).toBe(
      'travail 12h30–16h00, repos 9h00–12h30',
    );
  });

  it('cas limite : le vendredi, la plage fixe finit à 15h30', () => {
    expect(describeDay(timetable.dayOf(half(friday, 'morning')))).toBe(
      'travail 12h00–15h30, repos 8h30–12h00',
    );
  });

  it('une demi-journée sans moitié choisie (plan validé avant ALT-56) est l’après-midi', () => {
    const day = timetable.dayOf(half(thursday));

    expect(day.kind === 'half' ? day.part : null).toBe('afternoon');
  });

  describe('cas limite : un travail court couvre quand même la plage fixe de sa moitié', () => {
    // Demi-journée valant 5h sur une journée de 7h : il ne reste que 2h à travailler.
    const shortWork = new RecoveryDayTimetable(
      buildWorkRules({ ...laBrosseEtDupontSettings(), halfDayRecovery: Duration.ofHours(5) }),
    );

    it('après-midi de repos : le travail finit avec la plage fixe du matin (11h45)', () => {
      expect(describeDay(shortWork.dayOf(half(thursday, 'afternoon')))).toBe(
        'travail 9h45–11h45, repos 11h45–16h45',
      );
    });

    it('matin de repos : le travail commence avec la plage fixe de l’après-midi (13h45)', () => {
      expect(describeDay(shortWork.dayOf(half(thursday, 'morning')))).toBe(
        'travail 13h45–15h45, repos 8h45–13h45',
      );
    });
  });
});
