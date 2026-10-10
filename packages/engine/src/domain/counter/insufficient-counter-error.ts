import { DomainError } from '../shared/domain-error';
import type { Duration } from '../time/duration';

/**
 * Levée quand on veut poser une récupération sans avoir assez d'heures au compteur
 * (règle de l'entreprise : 7h cumulées pour une journée, 3h30 pour une demi-journée).
 */
export class InsufficientCounterError extends DomainError {
  /**
   * @param missing - Temps qui manque au compteur pour pouvoir poser la récupération
   * @param recoveryLabel - Libellé de la récupération demandée (« une journée de récup »…)
   */
  constructor(
    readonly missing: Duration,
    recoveryLabel: string,
  ) {
    super(`Compteur insuffisant pour ${recoveryLabel} : il manque ${missing.format()}.`);
  }
}
