import type { CalendarDate } from '../calendar/calendar-date';
import { CounterCalculator } from '../counter/counter-calculator';
import type { HoursCounter } from '../counter/hours-counter';
import type { WorkRules } from '../rules/work-rules';
import type { DatedPlan } from './dated-plan';

/** Solde prévu à la fin du plan en cours. */
export interface BalanceForecast {
  /** Compteur une fois les journées restantes faites et la récup posée. */
  readonly balance: HoursCounter;
  /** Dernier jour pris en compte (dernière journée du plan ou jour de la récup). */
  readonly until: CalendarDate;
  /** `true` si une récup à venir est déduite. */
  readonly includesRecovery: boolean;
}

/**
 * Prévoit le solde du compteur à la fin du plan en cours, pour ne pas croire disposer d'heures
 * déjà « réservées » par une récup prévue.
 *
 * Le plan est considéré comme suivi. Les jours passés sont déjà dans le compteur (recalé sur Smart RH) :
 * seuls aujourd'hui, les jours suivants et la récup à venir modifient la prévision.
 */
export class BalanceForecaster {
  private readonly counter: CounterCalculator;

  /**
   * @param rules - Règles horaires (temps attendu, valeur des récups)
   */
  constructor(rules: WorkRules) {
    this.counter = new CounterCalculator(rules);
  }

  /**
   * @param counter - Compteur actuel
   * @param plan - Plan en cours
   * @param today - Date du jour (fournie par l'horloge)
   * @returns Le solde prévu, ou `null` si le plan est terminé (plus rien à venir)
   */
  forecast(counter: HoursCounter, plan: DatedPlan, today: CalendarDate): BalanceForecast | null {
    const upcoming = plan.days.filter((day) => !day.date.isBefore(today));
    const recovery =
      plan.recovery !== undefined && !plan.recovery.date.isBefore(today) ? plan.recovery : null;
    const lastDay = upcoming.at(-1)?.date;
    // La récup tombe après les journées qui la préparent : c'est elle qui termine le plan.
    const until = recovery?.date ?? lastDay;
    if (until === undefined) {
      return null;
    }
    const afterDays = this.counter.applyWorkedDays(
      counter,
      upcoming.map((day) => day.plan.worked),
    );
    const balance =
      recovery === null
        ? afterDays
        : afterDays.add(this.counter.recoveryValue(recovery.kind).negate());
    return { balance, until, includesRecovery: recovery !== null };
  }
}
