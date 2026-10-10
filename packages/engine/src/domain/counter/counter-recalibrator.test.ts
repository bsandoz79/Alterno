import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { CounterRecalibrator } from './counter-recalibrator';
import { HoursCounter } from './hours-counter';

const min = (minutes: number): Duration => Duration.ofMinutes(minutes);
const counterOf = (minutes: number): HoursCounter => HoursCounter.of(min(minutes));

describe('CounterRecalibrator — recaler le compteur sur Smart RH', () => {
  const recalibrator = new CounterRecalibrator();

  it('aligne le compteur sur le solde officiel et indique l’ajustement', () => {
    const result = recalibrator.recalibrate(counterOf(20), min(5));

    expect(result.counter.equals(counterOf(5))).toBe(true);
    expect(result.adjustment.format({ signed: true })).toBe('-0h15');
    expect(result.warning).toBeNull();
  });

  it('ajustement nul quand Alterno et Smart RH sont d’accord', () => {
    const result = recalibrator.recalibrate(counterOf(-30), min(-30));

    expect(result.adjustment.isZero()).toBe(true);
    expect(result.warning).toBeNull();
  });

  it('avertit au-delà de 30 min d’écart', () => {
    const result = recalibrator.recalibrate(counterOf(60), min(15));

    expect(result.warning).toBe(
      'Écart important avec Smart RH (-0h45) : vérifie tes déclarations récentes.',
    );
  });

  it('avertit aussi quand Smart RH compte plus qu’Alterno', () => {
    expect(recalibrator.recalibrate(counterOf(0), min(60)).warning).toMatch(/\(\+1h\)/);
  });

  it('n’avertit pas à exactement 30 min (limite incluse)', () => {
    expect(recalibrator.recalibrate(counterOf(30), min(0)).warning).toBeNull();
  });

  it('accepte un seuil personnalisé', () => {
    const strict = new CounterRecalibrator(min(10));

    expect(strict.recalibrate(counterOf(15), min(0)).warning).not.toBeNull();
  });

  it('refuse un seuil nul ou négatif', () => {
    expect(() => new CounterRecalibrator(min(0))).toThrow(InvalidValueError);
    expect(() => new CounterRecalibrator(min(-5))).toThrow(InvalidValueError);
  });
});
