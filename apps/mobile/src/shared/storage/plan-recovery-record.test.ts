import { CalendarDate, Duration } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { toPlanRecoveryRecord, withPlanRecovery } from './plan-recovery-record';

const emptyPlan = { days: [], totalWorked: Duration.zero() };

describe('Récup du plan enregistrée', () => {
  it('relit la date et le type enregistrés', () => {
    const record = toPlanRecoveryRecord({
      date: CalendarDate.fromIsoString('2026-10-23'),
      kind: 'half',
    });

    const plan = withPlanRecovery(emptyPlan, record);

    expect(plan.recovery?.date.toIsoString()).toBe('2026-10-23');
    expect(plan.recovery?.kind).toBe('half');
  });

  it('ignore un type inconnu (donnée corrompue)', () => {
    expect(
      withPlanRecovery(emptyPlan, { date: '2026-10-23', kind: 'week' }).recovery,
    ).toBeUndefined();
  });

  it('laisse le plan sans récup quand rien n’est enregistré', () => {
    expect(withPlanRecovery(emptyPlan, null)).toBe(emptyPlan);
  });
});
