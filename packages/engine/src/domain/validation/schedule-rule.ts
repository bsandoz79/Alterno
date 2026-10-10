import type { DaySchedule } from '../rules/day-schedule';
import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';

/** Tout ce qu'une règle a besoin de connaître pour vérifier une journée. */
export interface DayContext {
  /** Jour de la semaine vérifié. */
  readonly day: Weekday;
  /** Horaires prévus de la journée. */
  readonly input: WorkedDayInput;
  /** Plages applicables ce jour-là. */
  readonly schedule: DaySchedule;
  /** Règles horaires complètes (pause minimale, temps attendu…). */
  readonly rules: WorkRules;
}

/** Non-respect d'une règle, avec un message lisible par l'utilisateur. */
export interface RuleViolation {
  /** Identifiant technique de la règle (stable, utile pour les tests et l'affichage). */
  readonly rule: string;
  /** Explication en français, affichée telle quelle. */
  readonly message: string;
}

/**
 * Règle de validation d'une journée planifiée.
 *
 * Chaque règle vérifie une seule chose (principe de responsabilité unique) et toutes sont
 * interchangeables pour le validateur (substitution de Liskov) : ajouter une règle revient à écrire
 * une nouvelle implémentation, sans modifier le validateur (principe ouvert/fermé).
 */
export interface ScheduleRule {
  /** Identifiant de la règle, repris dans ses violations. */
  readonly name: string;
  /**
   * Vérifie la journée.
   *
   * @param context - Journée et règles applicables
   * @returns Les violations constatées (tableau vide si la règle est respectée)
   */
  check(context: DayContext): readonly RuleViolation[];
}
