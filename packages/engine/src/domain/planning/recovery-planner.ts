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
   * Plan des jours travaillés avant la récupération.
   *
   * Le surplus déjà au compteur est conservé : s'il couvre la récup, les journées restent à 7h
   * au lieu de puiser dedans.
   *
   * @param days - Jours travaillés entre aujourd'hui et la veille de la récup, dans l'ordre
   * @param counter - Compteur actuel
   * @param kind - Journée ou demi-journée de récup
   * @param pace - Rythme de répartition ; régulier par défaut
   * @returns Le plan qui amène le compteur exactement à la valeur de la récup (ou le garde au-dessus)
   * @throws {InvalidValueError} Si la période est vide ou contient un jour non travaillé
   * @throws {ImpossiblePlanError} Si la récup est hors d'atteinte même en journées maximales
   */
  planForRecovery(
    days: readonly Weekday[],
    counter: HoursCounter,
    kind: RecoveryKind,
    pace: PaceStrategy = new SteadyPace(),
  ): Plan {
    const shortfall = this.counter.recoveryValue(kind).minus(counter.balance);
    const toCatchUp = shortfall.isNegative() ? Duration.zero() : shortfall;
    const expected = days.reduce((sum) => sum.plus(this.rules.expectedDailyWork), Duration.zero());
    const target = expected.plus(toCatchUp);

    const maximum = this.generator.maximumTotal(days);
    // Contrôlé ici plutôt que dans le générateur pour parler de récup, pas d'« objectif de 36h ».
    if (days.length > 0 && target.isGreaterThan(maximum)) {
      throw ImpossiblePlanError.recoveryOutOfReach(RECOVERY_LABELS[kind], target.minus(maximum));
    }
    return this.generator.planForTotalHours(days, target, pace);
  }
}
