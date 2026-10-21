import type { CalendarDate } from '../calendar/calendar-date';
import type { SchoolWeeks } from '../calendar/school-weeks';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import type { DatedDay, DatedPlan } from './dated-plan';
import type { PlanningPreferences } from './planning-preferences';
import { StandardDayPlanner, totalWorkedOf } from './standard-day-planner';

const DAYS_PER_WEEK = 7;

/**
 * Annule un plan, ou seulement sa récup. Les jours passés sont toujours gardés (ils ont été faits) ;
 * les jours annulés redeviennent des journées standard (temps attendu, rythme régulier).
 * Les heures d'avance déjà faites restent au compteur : seul le plan change.
 */
export class PlanCanceller {
  private readonly standardDays: StandardDayPlanner;

  /**
   * @param rules - Règles horaires (jours travaillés, temps attendu)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.standardDays = new StandardDayPlanner(rules, preferences);
  }

  /**
   * Annule le plan à partir d'un jour : les jours d'avant sont gardés, la fin de cette semaine-là
   * repasse en journées standard, et la récup à venir est annulée. Les semaines suivantes
   * reprendront la semaine standard (plan par défaut).
   *
   * @param plan - Plan en cours
   * @param from - Premier jour annulé (aujourd'hui, ou le lendemain d'un écart enregistré)
   * @param schoolWeeks - Semaines d'école (aucune journée standard ces semaines-là)
   * @returns Le plan annulé à partir de `from`
   */
  cancelFrom(plan: DatedPlan, from: CalendarDate, schoolWeeks: SchoolWeeks): DatedPlan {
    const kept = plan.days.filter((day) => day.date.isBefore(from));
    const endOfWeek = from.startOfWeek().plusDays(DAYS_PER_WEEK);
    const rest: CalendarDate[] = [];
    for (let date = from; date.isBefore(endOfWeek); date = date.plusDays(1)) {
      if (this.rules.isWorkingDay(date.weekday()) && !schoolWeeks.contains(date)) {
        rest.push(date);
      }
    }
    // Une récup déjà passée a été prise : elle reste visible dans le plan.
    const pastRecovery = plan.recovery?.date.isBefore(from) === true ? plan.recovery : undefined;
    return withDays([...kept, ...this.standardDays.daysFor(rest)], pastRecovery);
  }

  /**
   * Annule seulement la récup (refusée, ou plus nécessaire) : son jour redevient travaillé,
   * et les jours restants repassent en journées standard puisqu'il n'y a plus d'avance à prendre.
   *
   * @param plan - Plan en cours
   * @param today - Date du jour
   * @returns Le plan sans récup
   * @throws {InvalidValueError} Si le plan n'a pas de récup, ou si elle est déjà passée
   */
  cancelRecovery(plan: DatedPlan, today: CalendarDate): DatedPlan {
    const { recovery } = plan;
    if (recovery === undefined) {
      throw new InvalidValueError('Ce plan ne prévoit pas de récup.');
    }
    if (recovery.date.isBefore(today)) {
      throw new InvalidValueError('Cette récup est déjà passée : elle ne peut plus être annulée.');
    }
    const kept = plan.days.filter((day) => day.date.isBefore(today));
    // Les jours du plan préparent la récup : ils la précèdent tous, elle vient donc en dernier.
    const rest = [
      ...plan.days.filter((day) => !day.date.isBefore(today)).map((day) => day.date),
      recovery.date,
    ];
    return withDays([...kept, ...this.standardDays.daysFor(rest)], undefined);
  }
}

/** Plan formé de ces journées (total recalculé), avec ou sans récup. */
function withDays(days: readonly DatedDay[], recovery: DatedPlan['recovery']): DatedPlan {
  const plan = { days, totalWorked: totalWorkedOf(days) };
  return recovery === undefined ? plan : { ...plan, recovery };
}
