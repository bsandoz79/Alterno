import { Duration } from '../time/duration';

/**
 * Compteur d'heures : le cumul des écarts au temps attendu (surplus positifs, manques négatifs).
 *
 * Value object immuable : chaque mouvement renvoie un nouveau compteur.
 * Le solde peut être négatif (journées plus courtes que prévu non encore rattrapées).
 */
export class HoursCounter {
  private constructor(
    /** Solde actuel du compteur. */
    readonly balance: Duration,
  ) {}

  /**
   * Crée un compteur avec un solde existant (ex. le solde affiché par Smart RH).
   *
   * @param balance - Solde de départ, positif ou négatif
   * @returns Le compteur
   */
  static of(balance: Duration): HoursCounter {
    return new HoursCounter(balance);
  }

  /** @returns Un compteur à zéro */
  static zero(): HoursCounter {
    return new HoursCounter(Duration.zero());
  }

  /**
   * Ajoute un écart au compteur (négatif pour retirer du temps).
   *
   * @param delta - Écart à ajouter
   * @returns Le nouveau compteur
   */
  add(delta: Duration): HoursCounter {
    return new HoursCounter(this.balance.plus(delta));
  }

  /** @returns `true` si les deux compteurs ont le même solde */
  equals(other: HoursCounter): boolean {
    return this.balance.equals(other.balance);
  }

  /** @returns Le solde avec son signe : « +2h15 », « -0h30 », « 0h » */
  format(): string {
    return this.balance.format({ signed: true });
  }
}
