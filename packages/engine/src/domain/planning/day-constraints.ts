import { WEEKDAY_LABELS, type Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import type { WorkloadBounds } from './pace/workload';
import { DEFAULT_PLANNING_HABITS, type PlanningHabits } from './planning-habits';
import type { DayPreferences, FlexibleEnd, PlanningPreferences } from './planning-preferences';

/**
 * Contraintes de chaque jour pour la planification : règles de l'entreprise combinées aux préférences.
 *
 * Point unique où préférences et règles se rencontrent : le générateur, le constructeur d'horaires
 * et la planification de récup interrogent tous cet objet, ce qui garantit qu'ils appliquent les mêmes limites.
 */
export class DayConstraints {
  private constructor(
    private readonly rules: WorkRules,
    private readonly defaults: PlanningHabits,
    private readonly days: Readonly<Partial<Record<Weekday, DayPreferences>>>,
  ) {}

  /**
   * Combine règles et préférences après avoir vérifié leur cohérence pour chaque jour travaillé.
   *
   * @param rules - Règles horaires de l'entreprise
   * @param preferences - Préférences de l'utilisateur
   * @returns Les contraintes de planification
   * @throws {InvalidValueError} Si une arrivée, une pause ou un départ au plus tard sort des plages autorisées
   */
  static create(rules: WorkRules, preferences: PlanningPreferences): DayConstraints {
    const constraints = new DayConstraints(
      rules,
      preferences.defaults ?? DEFAULT_PLANNING_HABITS,
      preferences.days ?? {},
    );
    rules.workingDays().forEach((day) => {
      constraints.ensureConsistent(day);
    });
    return constraints;
  }

  /**
   * @param day - Jour travaillé
   * @returns L'arrivée et la pause habituelles de ce jour (préférence du jour, sinon habitude par défaut)
   */
  habitsFor(day: Weekday): PlanningHabits {
    const preferences = this.days[day];
    return {
      arrival: preferences?.arrival ?? this.defaults.arrival,
      lunchBreak: preferences?.lunchBreak ?? this.defaults.lunchBreak,
    };
  }

  /**
   * @param day - Jour travaillé
   * @returns L'heure d'arrivée à ne pas devancer : la plus tardive entre la règle (7h30) et la préférence
   */
  earliestArrivalFor(day: Weekday): TimeOfDay {
    const ruleLimit = this.rules.scheduleFor(day).earliestArrival;
    const preferred = this.days[day]?.earliestArrival;
    return preferred?.isAfter(ruleLimit) === true ? preferred : ruleLimit;
  }

  /**
   * @param day - Jour travaillé
   * @returns Le bout de journée qui absorbe les heures en plus ou en moins (le départ par défaut)
   */
  flexibleEndFor(day: Weekday): FlexibleEnd {
    return this.days[day]?.flexibleEnd ?? 'departure';
  }

  /**
   * Durée de la pause habituelle du jour, allongée au minimum de l'entreprise si elle est plus courte.
   *
   * @param day - Jour travaillé
   * @returns La durée de pause à prévoir
   */
  lunchDurationFor(day: Weekday): Duration {
    const habitual = this.habitsFor(day).lunchBreak.duration();
    const minimum = this.rules.minimumLunchBreak;
    // Une pause habituelle plus courte que le minimum de l'entreprise (45 min) est allongée jusqu'à ce minimum.
    return habitual.isLessThan(minimum) ? minimum : habitual;
  }

  /**
   * Départ d'une journée standard (7h) commencée à l'heure habituelle : c'est lui qui reste fixe
   * quand l'utilisateur préfère arriver plus tôt plutôt que partir plus tard.
   *
   * @param day - Jour travaillé
   * @returns L'arrivée habituelle + 7h + la pause, ramenée entre la fin de la plage fixe et le départ au plus tard
   */
  habitualDepartureFor(day: Weekday): TimeOfDay {
    const departure = this.habitsFor(day).arrival.plus(
      this.rules.expectedDailyWork.plus(this.lunchDurationFor(day)),
    );
    const earliest = this.rules.scheduleFor(day).earliestDeparture;
    const latest = this.latestDepartureFor(day);
    if (departure.isBefore(earliest)) {
      return earliest;
    }
    return departure.isAfter(latest) ? latest : departure;
  }

  /**
   * @param day - Jour travaillé
   * @returns L'heure de départ à ne pas dépasser : la plus tôt entre la règle (18h15) et la préférence
   */
  latestDepartureFor(day: Weekday): TimeOfDay {
    const ruleLimit = this.rules.scheduleFor(day).latestDeparture;
    const preferred = this.days[day]?.latestDeparture;
    return preferred?.isBefore(ruleLimit) === true ? preferred : ruleLimit;
  }

  /**
   * Bornes du temps travaillé d'un jour, préférences comprises.
   *
   * @param day - Jour travaillé
   * @returns Minimum, maximum et temps attendu de ce jour
   * @throws {InvalidValueError} Si le jour n'est pas travaillé
   */
  boundsFor(day: Weekday): WorkloadBounds {
    const expected = this.rules.expectedDailyWork;
    const minimum = this.rules.minimumWorkedTime(day);
    // Arriver plus tard ou partir plus tôt réduit l'amplitude : arrivée au plus tôt jusqu'au départ au plus tard
    // (préférences comprises), moins la pause minimale.
    const maximum = this.earliestArrivalFor(day)
      .durationUntil(this.latestDepartureFor(day))
      .minus(this.rules.minimumLunchBreak);

    if (this.days[day]?.exactlyExpected === true) {
      const exact = Duration.ofMinutes(
        Math.min(Math.max(expected.toMinutes(), minimum.toMinutes()), maximum.toMinutes()),
      );
      return { minimum: exact, maximum: exact, expected };
    }
    return { minimum, maximum, expected };
  }

  /** Vérifie que les préférences d'un jour restent dans les plages de l'entreprise. */
  private ensureConsistent(day: Weekday): void {
    const schedule = this.rules.scheduleFor(day);
    const { arrival, lunchBreak } = this.habitsFor(day);
    const label = WEEKDAY_LABELS[day];

    if (arrival.isBefore(schedule.earliestArrival) || arrival.isAfter(schedule.latestArrival)) {
      throw new InvalidValueError(
        `Le ${label}, l'arrivée habituelle (${arrival.format()}) doit être dans la plage d'arrivée (${schedule.flexibleArrival.format()}).`,
      );
    }
    const window = schedule.lunchWindow;
    if (lunchBreak.start.isBefore(window.start) || lunchBreak.end.isAfter(window.end)) {
      throw new InvalidValueError(
        `Le ${label}, la pause habituelle (${lunchBreak.format()}) doit être dans la plage de déjeuner (${window.format()}).`,
      );
    }
    const earliestArrival = this.days[day]?.earliestArrival;
    if (earliestArrival !== undefined) {
      if (earliestArrival.isBefore(schedule.earliestArrival)) {
        throw new InvalidValueError(
          `Le ${label}, l'arrivée au plus tôt (${earliestArrival.format()}) ne peut pas précéder le début de la plage d'arrivée (${schedule.earliestArrival.format()}).`,
        );
      }
      // L'arrivée habituelle sert de point de départ au plan : elle ne peut pas être interdite.
      if (earliestArrival.isAfter(arrival)) {
        throw new InvalidValueError(
          `Le ${label}, l'arrivée au plus tôt (${earliestArrival.format()}) ne peut pas suivre l'arrivée habituelle (${arrival.format()}).`,
        );
      }
    }
    const latestDeparture = this.days[day]?.latestDeparture;
    if (latestDeparture?.isBefore(schedule.earliestDeparture) === true) {
      throw new InvalidValueError(
        `Le ${label}, le départ au plus tard (${latestDeparture.format()}) ne peut pas précéder la fin de la plage fixe (${schedule.earliestDeparture.format()}).`,
      );
    }
  }
}
