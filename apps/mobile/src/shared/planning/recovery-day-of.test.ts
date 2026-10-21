import {
  CalendarDate,
  Duration,
  laBrosseEtDupontRules,
  type DatedPlan,
  type PlannedRecovery,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { recoveryDayOf } from './recovery-day-of';

const planWith = (recovery?: PlannedRecovery): DatedPlan => ({
  days: [],
  totalWorked: Duration.zero(),
  ...(recovery === undefined ? {} : { recovery }),
});
const rules = laBrosseEtDupontRules();

describe('Horaires du jour de récup du plan', () => {
  it('calcule la demi-journée selon les règles horaires', () => {
    const day = recoveryDayOf(
      planWith({ date: CalendarDate.fromIsoString('2026-10-22'), kind: 'half', part: 'afternoon' }),
      rules,
    );

    expect(day?.kind === 'half' ? day.rest.format() : null).toBe('12h30 – 16h00');
  });

  it('ne calcule rien sans récup dans le plan', () => {
    expect(recoveryDayOf(planWith(), rules)).toBeNull();
  });

  it('ne calcule rien pour une récup un jour non travaillé (donnée incohérente)', () => {
    expect(
      recoveryDayOf(
        planWith({ date: CalendarDate.fromIsoString('2026-10-24'), kind: 'half' }),
        rules,
      ),
    ).toBeNull();
  });
});
