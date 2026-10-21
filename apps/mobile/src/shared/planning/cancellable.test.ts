import { CalendarDate, Duration, TimeOfDay, TimeSlot, type DatedPlan } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { canCancelPlan, canCancelRecovery } from './cancellable';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const planOf = (isos: readonly string[], extra: Partial<DatedPlan> = {}): DatedPlan => ({
  days: isos.map((iso) => ({
    date: date(iso),
    plan: {
      day: date(iso).weekday(),
      arrival: at('08:30'),
      lunchBreak: TimeSlot.between(at('12:00'), at('12:45')),
      departure: at('16:15'),
      worked: Duration.ofHours(7),
    },
  })),
  totalWorked: Duration.ofHours(7 * isos.length),
  ...extra,
});
const today = date('2026-10-21');

describe('Ce qui peut être annulé', () => {
  it('un plan validé qui a encore des jours à venir', () => {
    expect(canCancelPlan(planOf(['2026-10-21', '2026-10-22']), today)).toBe(true);
  });

  it('pas la semaine standard (rien n’est enregistré), ni un plan terminé', () => {
    expect(canCancelPlan(planOf(['2026-10-21'], { isDefault: true }), today)).toBe(false);
    expect(canCancelPlan(planOf(['2026-10-19', '2026-10-20']), today)).toBe(false);
  });

  it('un plan dont il ne reste que la récup à venir', () => {
    const plan = planOf(['2026-10-20'], { recovery: { date: date('2026-10-23'), kind: 'full' } });

    expect(canCancelPlan(plan, today)).toBe(true);
    expect(canCancelRecovery(plan, today)).toBe(true);
  });

  it('pas une récup déjà passée, ni un plan sans récup', () => {
    expect(
      canCancelRecovery(
        planOf(['2026-10-21'], { recovery: { date: date('2026-10-20'), kind: 'half' } }),
        today,
      ),
    ).toBe(false);
    expect(canCancelRecovery(planOf(['2026-10-21']), today)).toBe(false);
  });
});
