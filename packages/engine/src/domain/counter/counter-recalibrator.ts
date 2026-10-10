import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { HoursCounter } from './hours-counter';

/** Écart au-delà duquel un recalage mérite l'attention de l'utilisateur. */
export const DEFAULT_RECALIBRATION_THRESHOLD = Duration.ofMinutes(30);

/** Résultat d'un recalage du compteur sur le solde officiel. */
export interface Recalibration {
  /** Compteur recalé : exactement le solde officiel. */
  readonly counter: HoursCounter;
  /** Correction appliquée (solde officiel moins compteur d'Alterno), à garder dans l'historique. */
  readonly adjustment: Duration;
  /** Avertissement si l'écart dépasse le seuil, sinon `null`. */
  readonly warning: string | null;
}

/**
 * Recale le compteur d'Alterno sur le solde officiel de Smart RH.
 *
 * Smart RH fait foi : Alterno ne doit jamais diverger des heures officielles. Le compteur prend donc
 * toujours la valeur saisie, et un écart important est signalé, car il révèle souvent un écart
 * oublié ou mal déclaré dans la semaine.
 */
export class CounterRecalibrator {
  /**
   * @param threshold - Écart au-delà duquel avertir (30 min par défaut), strictement positif
   * @throws {InvalidValueError} Si le seuil est nul ou négatif
   */
  constructor(private readonly threshold: Duration = DEFAULT_RECALIBRATION_THRESHOLD) {
    if (threshold.isNegative() || threshold.isZero()) {
      throw new InvalidValueError(
        'Le seuil d’avertissement du recalage doit être strictement positif.',
      );
    }
  }

  /**
   * Aligne le compteur sur le solde officiel.
   *
   * @param current - Compteur actuel d'Alterno
   * @param official - Solde affiché par Smart RH
   * @returns Le compteur recalé, l'ajustement appliqué et un éventuel avertissement
   */
  recalibrate(current: HoursCounter, official: Duration): Recalibration {
    const adjustment = official.minus(current.balance);
    // Limite incluse : un écart égal au seuil reste considéré comme normal.
    const warning = adjustment.abs().isGreaterThan(this.threshold)
      ? `Écart important avec Smart RH (${adjustment.format({ signed: true })}) : vérifie tes déclarations récentes.`
      : null;
    return { counter: HoursCounter.of(official), adjustment, warning };
  }
}
