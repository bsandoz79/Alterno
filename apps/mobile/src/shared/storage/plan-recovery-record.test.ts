import { CalendarDate, Duration, TimeOfDay } from '@alterno/engine';
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

  it('relit la moitié de journée en repos', () => {
    const record = toPlanRecoveryRecord({
      date: CalendarDate.fromIsoString('2026-10-23'),
      kind: 'half',
      part: 'morning',
    });

    expect(withPlanRecovery(emptyPlan, record).recovery?.part).toBe('morning');
  });

  it('ne garde pas de moitié absente ou inconnue (l’après-midi s’appliquera par défaut)', () => {
    expect(
      withPlanRecovery(emptyPlan, { date: '2026-10-23', kind: 'half', part: null }).recovery,
    ).not.toHaveProperty('part');
    expect(
      withPlanRecovery(emptyPlan, { date: '2026-10-23', kind: 'half', part: 'soir' }).recovery,
    ).not.toHaveProperty('part');
  });

  it('relit le suivi de la demande (état, jour et heure)', () => {
    const record = toPlanRecoveryRecord({
      date: CalendarDate.fromIsoString('2026-10-30'),
      kind: 'full',
      approval: {
        status: 'pending',
        requestedOn: CalendarDate.fromIsoString('2026-10-19'),
        requestedAt: TimeOfDay.of(9, 30),
      },
    });
    const approval = withPlanRecovery(emptyPlan, record).recovery?.approval;

    expect(approval?.status).toBe('pending');
    expect(approval?.requestedOn.toIsoString()).toBe('2026-10-19');
    expect(approval?.requestedAt.format()).toBe('9h30');
  });

  it('ignore un suivi absent ou incomplet (plan validé avant ALT-55)', () => {
    const base = { date: '2026-10-30', kind: 'full' };

    expect(withPlanRecovery(emptyPlan, base).recovery).not.toHaveProperty('approval');
    expect(
      withPlanRecovery(emptyPlan, { ...base, approvalStatus: 'pending', requestedOn: null })
        .recovery,
    ).not.toHaveProperty('approval');
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
