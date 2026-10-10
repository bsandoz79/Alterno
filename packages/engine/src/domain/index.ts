/**
 * Couche domaine : entités, value objects, règles métier et interfaces (ports).
 * Règle : aucune dépendance vers application, infrastructure, ni vers une librairie externe.
 */
export { DomainError, InvalidValueError } from './shared/domain-error';
export { Duration, type DurationFormatOptions } from './time/duration';
export { TimeOfDay } from './time/time-of-day';
export { TimeSlot } from './time/time-slot';
export { WEEKDAYS, WEEKDAY_LABELS, type Weekday } from './rules/weekday';
export { DaySchedule, type DayScheduleProps } from './rules/day-schedule';
export {
  WorkRules,
  type WorkRulesProps,
  type WeekSchedule,
  type LunchBreakPolicy,
} from './rules/work-rules';
export { laBrosseEtDupontRules } from './rules/presets/la-brosse-et-dupont';
export { WorkedTimeCalculator, type WorkedDayInput } from './worked-time/worked-time-calculator';
export { HoursCounter } from './counter/hours-counter';
export { InsufficientCounterError } from './counter/insufficient-counter-error';
export { CounterCalculator, type RecoveryKind } from './counter/counter-calculator';
export type { DayContext, RuleViolation, ScheduleRule } from './validation/schedule-rule';
export {
  PlanValidator,
  DEFAULT_SCHEDULE_RULES,
  type ValidationResult,
} from './validation/plan-validator';
export { ArrivalWindowRule } from './validation/rules/arrival-window-rule';
export { DepartureWindowRule } from './validation/rules/departure-window-rule';
export { LunchBreakRule } from './validation/rules/lunch-break-rule';
export type { DayPlan, Plan } from './planning/plan';
export { DEFAULT_PLANNING_HABITS, type PlanningHabits } from './planning/planning-habits';
export { ImpossiblePlanError } from './planning/impossible-plan-error';
export { PlanGenerator } from './planning/plan-generator';
