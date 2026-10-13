import { CounterCalculator } from '../counter/counter-calculator';
import type { HoursCounter } from '../counter/hours-counter';
import { RECOVERY_LABELS, type RecoveryKind } from '../counter/recovery-kind';
import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import { ImpossiblePlanError } from './impossible-plan-error';
import type { PaceStrategy } from './pace/pace-strategy';
import { SteadyPace } from './pace/steady-pace';
import type { Plan } from './plan';
import { PlanGenerator } from './plan-generator';
import type { PlanningPreferences } from './planning-preferences';

/**
 * Faisabilité d'une récup à une date :
 * - possible : heures à rattraper avant, et découvert qui restera après la récup (zéro si tout est rattrapé) ;
 * - impossible : heures qui manquent, même en journées maximales et en utilisant tout le découvert.
 */
export type RecoveryOutlook =
  | { readonly reachable: true; readonly catchUp: Duration; readonly deficitAfter: Duration }
  | { readonly reachable: false; readonly missing: Duration };

/**
 * Planifie les jours qui précèdent une récupération pour que le compteur la couvre à la date choisie.
 *
 * Ramène la question à un objectif d'heures : 7h par jour, plus ce qui manque au compteur pour la récup.
 * Le calcul des horaires est ensuite délégué à `PlanGenerator` (composition, pas de logique dupliquée).
 */
export class RecoveryPlanner {
  private readonly generator: PlanGenerator;
  private readonly counter: CounterCalculator;

  /**
   * @param rules - Règles horaires de l'entreprise
   * @param preferences - Préférences de l'utilisateur ; habitudes par défaut si absentes
   * @throws {InvalidValueError} Si une préférence sort des plages de l'entreprise
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.generator = new PlanGenerator(rules, preferences);
    this.counter = new CounterCalculator(rules);
  }

  /**
   * Heures à faire en plus d'ici la récup pour finir à zéro, sans découvert :
   * valeur de la récup moins le compteur, jamais négatif (un surplus déjà au compteur n'est pas « rendu »).
   *
   * @param counter - Compteur actuel
   * @param kind - Journée ou demi-journée de récup
   * @returns Le temps à rattraper avant la récup
   */
  hoursToCatchUp(counter: HoursCounter, kind: RecoveryKind): Duration {
    return nonNegative(this.counter.recoveryValue(kind).minus(counter.balance));
  }

  /**
   * Dit si la récup est possible après ces jours, et à quel prix.
   *
   * Le découvert n'est utilisé qu'en dernier recours : s'il y a le temps, tout est rattrapé avant
   * (compteur à zéro après la récup) ; sinon les jours sont faits au maximum et le reste est pris
   * sur le découvert autorisé (4h), à rattraper ensuite.
   *
   * @param days - Jours travaillés avant la récup, dans l'ordre
   * @param counter - Compteur actuel
   * @param kind - Journée ou demi-journée de récup
   * @returns Les heures à rattraper et le découvert restant, ou ce qui manque si la récup est impossible
   * @throws {InvalidValueError} Si un jour n'est pas travaillé
   */
  recoveryOutlook(
    days: readonly Weekday[],
    counter: HoursCounter,
    kind: RecoveryKind,
  ): RecoveryOutlook {
    const withoutDeficit = this.hoursToCatchUp(counter, kind);
    const minimum = nonNegative(withoutDeficit.minus(this.rules.maximumDeficit));
    const capacity = this.generator.maximumTotal(days).minus(this.expectedTotal(days));
    if (capacity.isLessThan(minimum)) {
      return { reachable: false, missing: minimum.minus(capacity) };
    }
    const catchUp = capacity.isLessThan(withoutDeficit) ? capacity : withoutDeficit;
    return { reachable: true, catchUp, deficitAfter: withoutDeficit.minus(catchUp) };
  }

  /**
   * Plan des jours travaillés avant la récupération.
   *
   * Le surplus déjà au compteur est conservé : s'il couvre la récup, les journées restent à 7h
   * au lieu de puiser dedans. Le découvert n'est utilisé que si la récup est trop proche pour tout rattraper.
   *
   * @param days - Jours travaillés entre aujourd'hui et la veille de la récup, dans l'ordre
   * @param counter - Compteur actuel
   * @param kind - Journée ou demi-journée de récup
   * @param pace - Rythme de répartition ; régulier par défaut
   * @returns Le plan qui amène le compteur à la valeur de la récup (ou le plus près possible, dans le découvert)
   * @throws {InvalidValueError} Si la période est vide ou contient un jour non travaillé
   * @throws {ImpossiblePlanError} Si la récup est hors d'atteinte même en journées maximales et avec le découvert
   */
  planForRecovery(
    days: readonly Weekday[],
    counter: HoursCounter,
    kind: RecoveryKind,
    pace: PaceStrategy = new SteadyPace(),
  ): Plan {
    const outlook = this.recoveryOutlook(days, counter, kind);
    // Contrôlé ici plutôt que dans le générateur pour parler de récup, pas d'« objectif de 36h ».
    // Une période vide est laissée au générateur, qui la refuse avec son propre message.
    if (!outlook.reachable && days.length > 0) {
      throw ImpossiblePlanError.recoveryOutOfReach(RECOVERY_LABELS[kind], outlook.missing);
    }
    const catchUp = outlook.reachable ? outlook.catchUp : Duration.zero();
    return this.generator.planForTotalHours(days, this.expectedTotal(days).plus(catchUp), pace);
  }

  /** Temps attendu sur ces jours (7h chacun), avant tout rattrapage. */
  private expectedTotal(days: readonly Weekday[]): Duration {
    return days.reduce((sum) => sum.plus(this.rules.expectedDailyWork), Duration.zero());
  }
}

/** La durée, ou zéro si elle est négative. */
function nonNegative(duration: Duration): Duration {
  return duration.isNegative() ? Duration.zero() : duration;
}
