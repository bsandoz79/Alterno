import { describe, expect, it } from 'vitest';

import { Duration } from '../time/duration';
import { HoursCounter } from './hours-counter';

describe('HoursCounter', () => {
  it('démarre à zéro par défaut', () => {
    expect(HoursCounter.zero().balance.isZero()).toBe(true);
  });

  it('se crée avec un solde existant, positif ou négatif', () => {
    expect(HoursCounter.of(Duration.ofHours(2, 15)).balance.toMinutes()).toBe(135);
    expect(HoursCounter.of(Duration.ofMinutes(-30)).balance.toMinutes()).toBe(-30);
  });

  it('ajoute un écart sans modifier le compteur d’origine (immuabilité)', () => {
    const counter = HoursCounter.of(Duration.ofHours(1));

    const updated = counter.add(Duration.ofMinutes(-90));

    expect(updated.balance.toMinutes()).toBe(-30);
    expect(counter.balance.toMinutes()).toBe(60);
  });

  it('compare deux compteurs par leur solde', () => {
    expect(
      HoursCounter.of(Duration.ofHours(7)).equals(HoursCounter.of(Duration.ofMinutes(420))),
    ).toBe(true);
  });

  it('s’affiche avec son signe : « +2h15 », « -0h30 », « 0h »', () => {
    expect(HoursCounter.of(Duration.ofHours(2, 15)).format()).toBe('+2h15');
    expect(HoursCounter.of(Duration.ofMinutes(-30)).format()).toBe('-0h30');
    expect(HoursCounter.zero().format()).toBe('0h');
  });
});
