import { Duration, HoursCounter, laBrosseEtDupontRules } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { balanceStatus } from './balance-status';

const rules = laBrosseEtDupontRules();
const at = (minutes: number): HoursCounter => HoursCounter.of(Duration.ofMinutes(minutes));

describe('État du solde', () => {
  it('heures d’avance quand le compteur est positif', () => {
    expect(balanceStatus(at(90), rules)).toEqual({
      tone: 'ahead',
      hint: 'Heures d’avance, utilisables pour une récup',
    });
  });

  it('équilibre à zéro', () => {
    expect(balanceStatus(HoursCounter.zero(), rules).tone).toBe('even');
  });

  it('heures à rattraper, dans le découvert autorisé jusqu’à -4h pile', () => {
    expect(balanceStatus(at(-240), rules)).toEqual({
      tone: 'behind',
      hint: 'Heures à rattraper (découvert autorisé : 4h)',
    });
  });

  it('alerte sous le découvert autorisé', () => {
    expect(balanceStatus(at(-241), rules)).toEqual({
      tone: 'beyond-deficit',
      hint: 'Au-delà du découvert autorisé (4h) : à rattraper au plus vite',
    });
  });
});
