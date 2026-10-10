import type { Weekday } from '../rules/weekday';
import { WEEKDAY_LABELS } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';
import { ArrivalWindowRule } from './rules/arrival-window-rule';
import { DepartureWindowRule } from './rules/departure-window-rule';
import { LunchBreakRule } from './rules/lunch-break-rule';
import type { RuleViolation, ScheduleRule } from './schedule-rule';

/** Résultat de la validation d'une journée. */
export interface ValidationResult {
  /** `true` si aucune règle n'est enfreinte. */
  readonly isValid: boolean;
  /** Toutes les violations, dans l'ordre des règles. */
  readonly violations: readonly RuleViolation[];
}

/**
 * Règles appliquées par défaut : arrivée, départ, pause.
 * Respecter ces trois règles garantit aussi la présence sur les plages fixes
 * et une journée qui ne dépasse pas le maximum (10h, 9h15 le vendredi).
 */
export const DEFAULT_SCHEDULE_RULES: readonly ScheduleRule[] = [
  new ArrivalWindowRule(),
  new DepartureWindowRule(),
  new LunchBreakRule(),
];

/**
 * Vérifie qu'une journée planifiée respecte les règles horaires et explique chaque problème.
 *
 * Le validateur ne connaît aucune règle en particulier : il applique la liste qu'on lui donne.
 * Ajouter une règle ne demande donc aucune modification ici (principe ouvert/fermé).
 */
export class PlanValidator {
  /**
   * @param rules - Règles horaires de l'entreprise
   * @param scheduleRules - Règles de validation à appliquer (par défaut : arrivée, départ, pause)
   */
  constructor(
    private readonly rules: WorkRules,
    private readonly scheduleRules: readonly ScheduleRule[] = DEFAULT_SCHEDULE_RULES,
  ) {}

  /**
   * Valide une journée planifiée.
   *
   * @param day - Jour de la semaine
   * @param input - Horaires prévus
   * @returns Le résultat, avec toutes les violations (aucune exception levée : un plan invalide
   *   est un cas normal à expliquer à l'utilisateur)
   */
  validate(day: Weekday, input: WorkedDayInput): ValidationResult {
    if (!this.rules.isWorkingDay(day)) {
      return {
        isValid: false,
        violations: [
          {
            rule: 'working-day',
            message: `Le ${WEEKDAY_LABELS[day]} n’est pas un jour travaillé.`,
          },
        ],
      };
    }

    const context = { day, input, schedule: this.rules.scheduleFor(day), rules: this.rules };
    const violations = this.scheduleRules.flatMap((rule) => rule.check(context));
    return { isValid: violations.length === 0, violations };
  }
}
