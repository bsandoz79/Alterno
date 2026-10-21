import {
  CalendarDate,
  DefaultWeekPlanner,
  SchoolWeeks,
  laBrosseEtDupontRules,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { defaultPlanSummary } from './default-plan-summary';

describe('Résumé de la semaine standard', () => {
  it('donne le total et le nombre de jours de la semaine standard', () => {
    const plan = new DefaultWeekPlanner(laBrosseEtDupontRules()).currentPlan(
      null,
      CalendarDate.fromIsoString('2026-10-21'),
      SchoolWeeks.none(),
    );

    expect(plan === null ? null : defaultPlanSummary(plan)).toBe(
      'Aucun plan validé pour cette semaine : Alterno suit une semaine standard de 35h sur 5 jours, au rythme régulier.',
    );
  });
});
