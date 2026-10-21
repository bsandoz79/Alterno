import type { CalendarDate } from '../calendar/calendar-date';
import type { SchoolWeeks } from '../calendar/school-weeks';
import type { WorkRules } from '../rules/work-rules';
import type { DatedPlan } from './dated-plan';
import type { PlanningPreferences } from './planning-preferences';
import { StandardDayPlanner, totalWorkedOf } from './standard-day-planner';

const DAYS_PER_WEEK = 7;

/**
 * Plan à suivre quand aucun plan validé ne couvre la semaine : une semaine standard,
 * temps attendu × jours travaillés (35h chez La Brosse et Dupont), au rythme régulier.
 * Ainsi l'accueil, la semaine et les rappels fonctionnent même sans simulation.
 */
export class DefaultWeekPlanner {
  private readonly standardDays: StandardDayPlanner;

  /**
   * @param rules - Règles horaires (temps attendu et jours travaillés viennent d'ici, jamais en dur)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.standardDays = new StandardDayPlanner(rules, preferences);
  }

  /**
   * Choisit le plan à suivre. Le plan validé est prioritaire dès qu'il a un jour dans la semaine
   * de référence ou après ; sinon, la semaine standard est proposée (sauf semaine d'école).
   *
   * @param stored - Plan validé enregistré, ou `null`
   * @param today - Date du jour
   * @param schoolWeeks - Semaines d'école (pas d'horaire en entreprise)
   * @returns Le plan validé, la semaine standard (`isDefault`), ou `null` s'il n'y a rien à suivre
   * @throws {ImpossiblePlanError} Si le temps attendu ne tient pas dans les plages d'un jour (règles incohérentes)
   */
  currentPlan(
    stored: DatedPlan | null,
    today: CalendarDate,
    schoolWeeks: SchoolWeeks,
  ): DatedPlan | null {
    const monday = this.referenceWeek(today);
    if (stored?.days.some((day) => !day.date.isBefore(monday)) === true) {
      return stored;
    }
    if (schoolWeeks.contains(monday)) {
      return stored;
    }
    // La récup posée par le plan terminé est un jour de repos, pas un jour à travailler.
    const recovery = stored?.recovery?.date;
    const dates = this.workingDates(monday).filter((date) => !(recovery?.equals(date) ?? false));
    const days = this.standardDays.daysFor(dates);
    return { days, totalWorked: totalWorkedOf(days), isDefault: true };
  }

  /**
   * Semaine de référence : celle du jour, ou la suivante quand il n'y reste plus de jour travaillé
   * (le week-end, on prépare la semaine qui vient).
   */
  private referenceWeek(today: CalendarDate): CalendarDate {
    const monday = today.startOfWeek();
    const remaining = this.workingDates(monday).some((date) => !date.isBefore(today));
    return remaining ? monday : monday.plusDays(DAYS_PER_WEEK);
  }

  /** Jours travaillés (selon les règles) de la semaine qui commence ce lundi. */
  private workingDates(monday: CalendarDate): readonly CalendarDate[] {
    return Array.from({ length: DAYS_PER_WEEK }, (_, index) => monday.plusDays(index)).filter(
      (date) => this.rules.isWorkingDay(date.weekday()),
    );
  }
}
