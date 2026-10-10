import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import type { HoursCounter } from './hours-counter';
import { InsufficientCounterError } from './insufficient-counter-error';

/** Type de récupération : une journée entière ou une demi-journée. */
export type RecoveryKind = 'full' | 'half';

const RECOVERY_LABELS: Readonly<Record<RecoveryKind, string>> = {
  full: 'une journée de récup',
  half: 'une demi-journée de récup',
};

/**
 * Fait évoluer le compteur d'heures selon les règles de l'entreprise.
 *
 * Le système attend un temps fixe par jour (7h) : le surplus alimente le compteur, le manque y est pris.
 * Une récupération n'est pas un mouvement à part : c'est une journée (ou demi-journée) moins travaillée,
 * autorisée seulement si le compteur couvre la valeur de la récupération.
 */
export class CounterCalculator {
  /**
   * @param rules - Règles horaires à appliquer (temps attendu, valeur des récupérations)
   */
  constructor(private readonly rules: WorkRules) {}

  /**
   * Écart d'une journée au temps attendu.
   *
   * @param worked - Temps travaillé comptabilisé ce jour-là
   * @returns L'écart signé à ajouter au compteur (+1h pour 8h, −30 min pour 6h30)
   */
  dayBalance(worked: Duration): Duration {
    return worked.minus(this.rules.expectedDailyWork);
  }

  /**
   * Applique une journée travaillée au compteur.
   *
   * @param counter - Compteur avant la journée
   * @param worked - Temps travaillé comptabilisé
   * @returns Le compteur après la journée
   */
  applyWorkedDay(counter: HoursCounter, worked: Duration): HoursCounter {
    return counter.add(this.dayBalance(worked));
  }

  /**
   * Applique plusieurs journées travaillées, dans l'ordre (une semaine, une période…).
   *
   * @param counter - Compteur avant la période
   * @param workedDays - Temps travaillé de chaque journée
   * @returns Le compteur après la période
   */
  applyWorkedDays(counter: HoursCounter, workedDays: readonly Duration[]): HoursCounter {
    return workedDays.reduce((current, worked) => this.applyWorkedDay(current, worked), counter);
  }

  /**
   * Indique si le compteur permet de poser une récupération.
   *
   * @param counter - Compteur actuel
   * @param kind - Journée ou demi-journée
   * @returns `true` si le solde atteint la valeur de la récupération (7h ou 3h30)
   */
  canTakeRecovery(counter: HoursCounter, kind: RecoveryKind): boolean {
    return !counter.balance.isLessThan(this.recoveryValue(kind));
  }

  /**
   * Pose une récupération : la journée compte comme travaillée avec le temps réellement fait
   * (rien pour une journée entière, l'autre moitié pour une demi-journée).
   *
   * @param counter - Compteur avant la récupération
   * @param kind - Journée ou demi-journée
   * @param workedThatDay - Temps travaillé ce jour-là ; par défaut 0 pour une journée,
   *   et le temps attendu moins la demi-récup (3h30) pour une demi-journée
   * @returns Le compteur après la récupération
   * @throws {InsufficientCounterError} Si le solde ne couvre pas la récupération
   */
  takeRecovery(counter: HoursCounter, kind: RecoveryKind, workedThatDay?: Duration): HoursCounter {
    const value = this.recoveryValue(kind);
    if (!this.canTakeRecovery(counter, kind)) {
      throw new InsufficientCounterError(value.minus(counter.balance), RECOVERY_LABELS[kind]);
    }
    const worked = workedThatDay ?? this.defaultWorkedTime(kind);
    return this.applyWorkedDay(counter, worked);
  }

  /** Valeur d'une récupération selon son type. */
  private recoveryValue(kind: RecoveryKind): Duration {
    return kind === 'full' ? this.rules.fullDayRecovery : this.rules.halfDayRecovery;
  }

  /** Temps travaillé par défaut un jour de récupération. */
  private defaultWorkedTime(kind: RecoveryKind): Duration {
    return kind === 'full'
      ? Duration.zero()
      : this.rules.expectedDailyWork.minus(this.rules.halfDayRecovery);
  }
}
