import { CounterRecalibrator, type Recalibration } from '../domain/counter/counter-recalibrator';
import type { HoursCounter } from '../domain/counter/hours-counter';
import type { CounterRepository } from '../domain/ports/counter-repository';
import type { Duration } from '../domain/time/duration';

/**
 * Cas d'usage « Recaler le compteur » : l'utilisateur saisit le solde affiché par Smart RH,
 * qui fait foi ; Alterno aligne son compteur dessus.
 *
 * `preview` calcule la correction pour l'afficher pendant la saisie ; `execute` l'enregistre.
 * Le dépôt est injecté (port) : SQLite ou navigateur dans l'app, mémoire en test.
 */
export class RecalibrateCounter {
  /**
   * @param counters - Dépôt du compteur
   * @param recalibrator - Règle de recalage (seuil d'avertissement de 30 min par défaut)
   */
  constructor(
    private readonly counters: CounterRepository,
    private readonly recalibrator: CounterRecalibrator = new CounterRecalibrator(),
  ) {}

  /**
   * Calcule le recalage sans rien enregistrer.
   *
   * @param current - Compteur actuel d'Alterno
   * @param official - Solde affiché par Smart RH
   * @returns Le compteur recalé, la correction et un éventuel avertissement
   */
  preview(current: HoursCounter, official: Duration): Recalibration {
    return this.recalibrator.recalibrate(current, official);
  }

  /**
   * Recale le compteur enregistré sur le solde officiel.
   *
   * @param official - Solde affiché par Smart RH
   * @returns Le recalage appliqué
   */
  async execute(official: Duration): Promise<Recalibration> {
    const recalibration = this.preview(await this.counters.load(), official);
    await this.counters.save(recalibration.counter);
    return recalibration;
  }
}
