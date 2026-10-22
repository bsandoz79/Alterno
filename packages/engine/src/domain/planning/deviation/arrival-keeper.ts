import { WEEKDAY_LABELS } from '../../rules/weekday';
import type { WorkRules } from '../../rules/work-rules';
import { InvalidValueError } from '../../shared/domain-error';
import { Duration } from '../../time/duration';
import type { TimeOfDay } from '../../time/time-of-day';
import { WorkedTimeCalculator } from '../../worked-time/worked-time-calculator';
import { DayConstraints } from '../day-constraints';
import type { DayPlan, Plan } from '../plan';
import type { PlanningPreferences } from '../planning-preferences';
import type { ArrivalChoice } from './arrival-choice';
import type { LateArrival } from './late-arrival';

/**
 * Propose de garder son heure d'arrivée quand un recalcul la repousse.
 *
 * Après un écart (parti plus tard un jour), les jours suivants ont moins d'heures à faire. Quand le départ
 * est déjà à la fin de la plage fixe (16h00), la seule façon d'en faire moins est d'arriver plus tard.
 * L'utilisateur peut préférer garder son arrivée : le départ reste celui du recalcul, la journée s'allonge
 * et le surplus va au compteur. Le recalcul lui-même (`DeviationReplanner`) n'est pas modifié.
 */
export class ArrivalKeeper {
  private readonly constraints: DayConstraints;
  private readonly workedTime: WorkedTimeCalculator;

  /**
   * @param rules - Règles horaires de l'entreprise
   * @param preferences - Préférences de l'utilisateur ; habitudes par défaut si absentes
   * @throws {InvalidValueError} Si une préférence sort des plages de l'entreprise
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.constraints = DayConstraints.create(rules, preferences);
    this.workedTime = new WorkedTimeCalculator(rules);
  }

  /**
   * Jours où l'arrivée prévue est plus tardive que l'arrivée habituelle.
   *
   * @param plan - Plan recalculé
   * @param fromIndex - Premier jour à examiner (le lendemain de l'écart)
   * @returns Les jours concernés, dans l'ordre du plan
   */
  lateArrivals(plan: Plan, fromIndex: number): readonly LateArrival[] {
    return plan.days.flatMap((day, index) => {
      const preferred = this.constraints.habitsFor(day.day).arrival;
      return index >= fromIndex && day.arrival.isAfter(preferred)
        ? [{ index, planned: day.arrival, preferred }]
        : [];
    });
  }

  /**
   * Avance l'arrivée des jours donnés en gardant leur départ et leur pause.
   *
   * @param plan - Plan recalculé
   * @param indexes - Positions des jours à modifier
   * @param choice - Arrivée habituelle, ou heure choisie
   * @returns Le plan modifié ; son total dépasse celui du plan reçu du temps gagné
   * @throws {InvalidValueError} Si un jour n'existe pas ou si l'heure choisie sort de la plage d'arrivée
   */
  keep(plan: Plan, indexes: readonly number[], choice: ArrivalChoice): Plan {
    indexes.forEach((index) => {
      if (plan.days[index] === undefined) {
        throw new InvalidValueError(
          `La journée n°${String(index + 1)} n'existe pas dans le plan (${String(plan.days.length)} jours).`,
        );
      }
    });
    const days = plan.days.map((day, index) =>
      indexes.includes(index) ? this.withArrival(day, choice) : day,
    );
    return {
      days,
      totalWorked: days.reduce((sum, day) => sum.plus(day.worked), Duration.zero()),
    };
  }

  /** La journée avec la nouvelle arrivée, le temps travaillé recalculé par les règles. */
  private withArrival(day: DayPlan, choice: ArrivalChoice): DayPlan {
    const arrival =
      choice.kind === 'preferred' ? this.constraints.habitsFor(day.day).arrival : choice.arrival;
    this.ensureAllowed(day, arrival);
    const changed = { ...day, arrival };
    return { ...changed, worked: this.workedTime.compute(day.day, changed) };
  }

  /** L'arrivée reste entre l'arrivée au plus tôt (7h30 ou préférence) et le début de la plage fixe (9h00). */
  private ensureAllowed(day: DayPlan, arrival: TimeOfDay): void {
    const earliest = this.constraints.earliestArrivalFor(day.day);
    const latest = this.rules.scheduleFor(day.day).latestArrival;
    if (arrival.isBefore(earliest) || arrival.isAfter(latest)) {
      throw new InvalidValueError(
        `Le ${WEEKDAY_LABELS[day.day]}, l'arrivée (${arrival.format()}) doit être entre ${earliest.format()} et ${latest.format()}.`,
      );
    }
  }
}
