import type { CalendarDate } from '../calendar/calendar-date';
import type { HoursCounter } from '../counter/hours-counter';
import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import type { DatedPlan } from './dated-plan';
import { PlanGenerator } from './plan-generator';
import type { PlanningPreferences } from './planning-preferences';

/** Objectif proposé pour une période : ce qui est déjà fait, le reste à faire et le maximum possible. */
export interface ObjectiveSuggestion {
  /** Temps déjà travaillé cette semaine, avant la période. */
  readonly done: Duration;
  /** Temps attendu sur la semaine (et la période) moins ce qui est déjà fait. */
  readonly remaining: Duration;
  /** Le plus que l'on puisse faire : limité par les horaires et par le plafond du compteur. */
  readonly maximum: Duration;
  /**
   * Objectif qui ramène un compteur négatif à 0 sur la période (reste à faire + retard),
   * `null` si le compteur n'est pas négatif.
   */
  readonly backToZero: Duration | null;
}

/**
 * Propose l'objectif d'une simulation commencée en cours de semaine : le temps attendu
 * (35h chez La Brosse et Dupont) moins ce qui est déjà fait, plutôt qu'un objectif fixe
 * devenu irréalisable sur les jours restants. Propose aussi le maximum : ce qui remplit
 * le compteur jusqu'à son plafond, sans dépasser les départs au plus tard, et, si le compteur
 * est négatif, l'objectif qui le ramène à 0 sur la période.
 */
export class WeekObjectiveAdvisor {
  private readonly generator: PlanGenerator;

  /**
   * @param rules - Règles horaires (temps attendu, plafond du compteur, horaires)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.generator = new PlanGenerator(rules, preferences);
  }

  /**
   * La journée d'aujourd'hui compte-t-elle comme faite ? Oui une fois l'heure de départ prévue
   * atteinte : avant, la simulation peut encore la replanifier.
   *
   * @param plan - Plan en cours (validé ou semaine standard), ou `null`
   * @param today - Date du jour
   * @param now - Heure actuelle
   * @returns `true` si aujourd'hui est planifié et que son départ prévu est passé
   */
  isDayOver(plan: DatedPlan | null, today: CalendarDate, now: TimeOfDay): boolean {
    const day = plan?.days.find((candidate) => candidate.date.equals(today));
    return day !== undefined && !now.isBefore(day.plan.departure);
  }

  /**
   * @param plan - Plan en cours, pour les heures prévues ou déclarées des jours déjà passés
   * @param period - Jours à planifier, dans l'ordre
   * @param counter - Compteur actuel (pour le plafond)
   * @returns L'objectif proposé, ou `null` s'il n'y a aucun jour à planifier
   */
  suggest(
    plan: DatedPlan | null,
    period: readonly CalendarDate[],
    counter: HoursCounter,
  ): ObjectiveSuggestion | null {
    const [first] = period;
    if (first === undefined) {
      return null;
    }
    const expected = this.rules.expectedDailyWork;
    // Jours travaillés de la semaine déjà passés avant la période : le plan est considéré comme suivi,
    // un jour sans plan compte donc pour le temps attendu.
    const past = this.workingDatesBefore(first);
    const done = past.reduce((sum, date) => {
      const day = plan?.days.find((candidate) => candidate.date.equals(date));
      return sum.plus(day?.plan.worked ?? expected);
    }, Duration.zero());
    const expectedTotal = [...past, ...period].reduce((sum) => sum.plus(expected), Duration.zero());
    const remaining = atLeastZero(expectedTotal.minus(done));

    const feasible = this.generator.maximumTotal(period.map((date) => date.weekday()));
    const cap = this.rules.maximumCredit;
    // Les heures au-delà du plafond ne comptent plus : inutile de proposer de les faire.
    const capped =
      cap === null ? feasible : remaining.plus(atLeastZero(cap.minus(counter.balance)));
    // En retard au compteur : faire le reste de la période, plus le retard (−1h → 36h sur une semaine).
    // Pas plafonné aux horaires : si c'est trop, la simulation dira combien il manque (passer à 2 semaines).
    const backToZero = counter.balance.isNegative() ? remaining.plus(counter.balance.abs()) : null;
    return {
      done,
      remaining,
      maximum: capped.isGreaterThan(feasible) ? feasible : capped,
      backToZero,
    };
  }

  /** Jours travaillés de la semaine de `first`, avant lui. */
  private workingDatesBefore(first: CalendarDate): readonly CalendarDate[] {
    const dates: CalendarDate[] = [];
    for (let date = first.startOfWeek(); date.isBefore(first); date = date.plusDays(1)) {
      if (this.rules.isWorkingDay(date.weekday())) {
        dates.push(date);
      }
    }
    return dates;
  }
}

/** La durée, ou zéro si elle est négative. */
function atLeastZero(duration: Duration): Duration {
  return duration.isNegative() ? Duration.zero() : duration;
}
