import { describe, expect, it } from 'vitest';

import { HoursCounter } from '../domain/counter/hours-counter';
import type { CounterRepository } from '../domain/ports/counter-repository';
import { Duration } from '../domain/time/duration';
import { RecalibrateCounter } from './recalibrate-counter';

/** Dépôt en mémoire, initialisé avec un solde. */
const memoryCounter = (start: Duration): CounterRepository & { current: HoursCounter } => {
  const repository = {
    current: HoursCounter.of(start),
    load: () => Promise.resolve(repository.current),
    save: (counter: HoursCounter) => {
      repository.current = counter;
      return Promise.resolve();
    },
  };
  return repository;
};

describe('RecalibrateCounter — recaler le compteur sur le solde Smart RH', () => {
  it('aperçu : calcule la correction sans rien enregistrer', () => {
    const counter = memoryCounter(Duration.ofHours(1, 55));
    const recalibration = new RecalibrateCounter(counter).preview(
      counter.current,
      Duration.ofHours(2, 15),
    );

    expect(recalibration.adjustment.format({ signed: true })).toBe('+0h20');
    expect(recalibration.warning).toBeNull();
    expect(counter.current.format()).toBe('+1h55');
  });

  it('enregistre le solde officiel comme nouveau compteur', async () => {
    const counter = memoryCounter(Duration.ofHours(1, 55));
    const recalibration = await new RecalibrateCounter(counter).execute(Duration.ofHours(2, 15));

    expect(counter.current.format()).toBe('+2h15');
    expect(recalibration.counter.format()).toBe('+2h15');
  });

  it('avertit quand l’écart dépasse 30 min, mais recale quand même (Smart RH fait foi)', async () => {
    const counter = memoryCounter(Duration.ofHours(3));
    const recalibration = await new RecalibrateCounter(counter).execute(
      Duration.ofMinutes(30).negate(),
    );

    expect(recalibration.warning).toBe(
      'Écart important avec Smart RH (-3h30) : vérifie tes déclarations récentes.',
    );
    expect(counter.current.format()).toBe('-0h30');
  });
});
