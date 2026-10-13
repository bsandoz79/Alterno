import { CounterCalculator, type HoursCounter, type WorkRules } from '@alterno/engine';

/** Ton du solde : avance, équilibre, retard dans le découvert, ou découvert dépassé. */
export type BalanceTone = 'ahead' | 'even' | 'behind' | 'beyond-deficit';

/** Ce que la carte du solde affiche sous le chiffre. */
export interface BalanceStatus {
  readonly tone: BalanceTone;
  readonly hint: string;
}

/**
 * Qualifie le solde pour l'afficher : le découvert autorisé (4h chez La Brosse et Dupont)
 * sépare un simple retard d'un dépassement à signaler.
 *
 * @param counter - Compteur actuel
 * @param rules - Règles horaires (découvert autorisé)
 * @returns Le ton et l'explication du solde
 */
export function balanceStatus(counter: HoursCounter, rules: WorkRules): BalanceStatus {
  const deficit = rules.maximumDeficit.format();
  if (new CounterCalculator(rules).isBeyondMaximumDeficit(counter)) {
    return {
      tone: 'beyond-deficit',
      hint: `Au-delà du découvert autorisé (${deficit}) : à rattraper au plus vite`,
    };
  }
  if (counter.balance.isNegative()) {
    return { tone: 'behind', hint: `Heures à rattraper (découvert autorisé : ${deficit})` };
  }
  if (counter.balance.isZero()) {
    return { tone: 'even', hint: 'Compteur à l’équilibre' };
  }
  return { tone: 'ahead', hint: 'Heures d’avance, utilisables pour une récup' };
}
