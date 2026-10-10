import { DomainError } from '../shared/domain-error';
import type { Duration } from '../time/duration';

/**
 * Levée quand l'objectif d'heures ne peut pas être atteint sur la période demandée,
 * compte tenu des journées minimale et maximale de chaque jour.
 *
 * Le message est destiné à l'écran Simulation : il dit précisément de combien l'objectif est hors d'atteinte.
 */
export class ImpossiblePlanError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  /**
   * Objectif supérieur à ce que la période permet, même en faisant des journées maximales.
   *
   * @param target - Objectif demandé
   * @param maximum - Total maximal atteignable sur la période
   * @returns L'erreur, avec le temps manquant
   */
  static aboveMaximum(target: Duration, maximum: Duration): ImpossiblePlanError {
    return new ImpossiblePlanError(
      `Objectif de ${target.format()} trop haut pour cette période : maximum ${maximum.format()}, il manque ${target.minus(maximum).format()}.`,
    );
  }

  /**
   * Objectif inférieur à la présence obligatoire : les plages fixes imposent déjà plus de travail.
   *
   * @param target - Objectif demandé
   * @param minimum - Total minimal imposé sur la période
   * @returns L'erreur, avec le minimum à respecter
   */
  static belowMinimum(target: Duration, minimum: Duration): ImpossiblePlanError {
    return new ImpossiblePlanError(
      `Objectif de ${target.format()} trop bas pour cette période : minimum ${minimum.format()} (plages fixes).`,
    );
  }
}
