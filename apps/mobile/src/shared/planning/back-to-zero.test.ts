import { Duration, HoursCounter } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { BACK_TO_ZERO_PARAM, isBackToZeroRequest, needsBackToZero } from './back-to-zero';

describe('Revenir à 0', () => {
  it('ne s’affiche que pour un compteur négatif', () => {
    expect(needsBackToZero(HoursCounter.of(Duration.ofHours(-1)))).toBe(true);
    expect(needsBackToZero(HoursCounter.zero())).toBe(false);
    expect(needsBackToZero(HoursCounter.of(Duration.ofHours(2)))).toBe(false);
  });

  it('reconnaît la demande venue d’un lien vers la simulation', () => {
    expect(isBackToZeroRequest(BACK_TO_ZERO_PARAM)).toBe(true);
    expect(isBackToZeroRequest([BACK_TO_ZERO_PARAM])).toBe(true);
    expect(isBackToZeroRequest(undefined)).toBe(false);
    expect(isBackToZeroRequest('autre')).toBe(false);
  });
});
