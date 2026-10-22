import { Duration, HoursCounter } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { counterWarning } from './counter-warning';

const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const counter = HoursCounter.of(h(0, 40));

describe('counterWarning — avertir avant de valider un plan qui fait baisser le compteur', () => {
  it('nomme la perte et le compteur avant et après', () => {
    const warning = counterWarning({
      objective: 'hours',
      effect: h(-1, -5),
      counter,
      targetWithoutLoss: h(35),
    });

    expect(warning?.text).toBe('Ce plan retire 1h05 à ton compteur (+0h40 → -0h25).');
    expect(warning?.adjustedTarget.format()).toBe('35h');
  });

  it('rien quand le plan ne fait pas baisser le compteur', () => {
    const base = { objective: 'hours' as const, counter, targetWithoutLoss: h(35) };

    expect(counterWarning({ ...base, effect: Duration.zero() })).toBeNull();
    expect(counterWarning({ ...base, effect: h(2) })).toBeNull();
  });

  it('rien pour une récup : le retrait est voulu', () => {
    expect(
      counterWarning({
        objective: 'recovery',
        effect: h(-1),
        counter,
        targetWithoutLoss: h(35),
      }),
    ).toBeNull();
  });
});
