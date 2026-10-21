import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { Duration } from '../domain/time/duration';
import { TimeOfDay } from '../domain/time/time-of-day';
import { AnswerRecoveryApproval } from './answer-recovery-approval';

const pendingPlan: DatedPlan = {
  days: [],
  totalWorked: Duration.zero(),
  recovery: {
    date: CalendarDate.fromIsoString('2026-10-30'),
    kind: 'full',
    approval: {
      status: 'pending',
      requestedOn: CalendarDate.fromIsoString('2026-10-19'),
      requestedAt: TimeOfDay.of(9, 0),
    },
  },
};

/** Dépôt en mémoire qui compte les enregistrements. */
const memoryPlans = (
  plan: DatedPlan | null,
): PlanRepository & { current: DatedPlan | null; saves: number } => {
  const repository = {
    current: plan,
    saves: 0,
    loadCurrent: () => Promise.resolve(repository.current),
    saveCurrent: (saved: DatedPlan) => {
      repository.current = saved;
      repository.saves += 1;
      return Promise.resolve();
    },
  };
  return repository;
};

describe('AnswerRecoveryApproval — répondre « ma récup a-t-elle été acceptée ? »', () => {
  it('oui : la récup est validée et enregistrée (les relances seront annulées)', async () => {
    const plans = memoryPlans(pendingPlan);
    const approval = await new AnswerRecoveryApproval(plans).execute('approved');

    expect(approval?.status).toBe('approved');
    expect(plans.current?.recovery?.approval?.status).toBe('approved');
    expect(plans.current?.recovery?.approval?.requestedOn.toIsoString()).toBe('2026-10-19');
  });

  it('non : la récup est marquée refusée', async () => {
    const plans = memoryPlans(pendingPlan);
    await new AnswerRecoveryApproval(plans).execute('refused');

    expect(plans.current?.recovery?.approval?.status).toBe('refused');
  });

  it('pas encore : rien ne change, la prochaine relance reste prévue', async () => {
    const plans = memoryPlans(pendingPlan);
    const approval = await new AnswerRecoveryApproval(plans).execute('not-yet');

    expect(approval?.status).toBe('pending');
    expect(plans.saves).toBe(0);
  });

  it('sans récup suivie, il n’y a rien à répondre', async () => {
    const withoutRecovery = memoryPlans({ days: [], totalWorked: Duration.zero() });

    await expect(new AnswerRecoveryApproval(withoutRecovery).execute('approved')).resolves.toBe(
      null,
    );
    await expect(new AnswerRecoveryApproval(memoryPlans(null)).execute('approved')).resolves.toBe(
      null,
    );
    expect(withoutRecovery.saves).toBe(0);
  });
});
