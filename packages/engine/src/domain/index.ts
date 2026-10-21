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
export {
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
} from './rules/presets/la-brosse-et-dupont';
export { buildWorkRules, type DayTimes, type WorkRulesSettings } from './rules/work-rules-settings';
export { parseClockTime } from './time/parse-clock-time';
export { WorkedTimeCalculator, type WorkedDayInput } from './worked-time/worked-time-calculator';
export { HoursCounter } from './counter/hours-counter';
export { InsufficientCounterError } from './counter/insufficient-counter-error';
export { CounterCalculator } from './counter/counter-calculator';
export { RECOVERY_LABELS, type RecoveryKind } from './counter/recovery-kind';
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
export type { DayPreferences, PlanningPreferences } from './planning/planning-preferences';
export { ImpossiblePlanError } from './planning/impossible-plan-error';
export { PlanGenerator } from './planning/plan-generator';
export { RecoveryPlanner, type RecoveryOutlook } from './planning/recovery-planner';
export type { PaceStrategy } from './planning/pace/pace-strategy';
export type { Workload, WorkloadBounds } from './planning/pace/workload';
export { SteadyPace } from './planning/pace/steady-pace';
export { FastPace } from './planning/pace/fast-pace';
export { LatePace } from './planning/pace/late-pace';
export type { DeviationAlert, DeviationAlertKind } from './planning/deviation/deviation-alert';
export type { DeviationOutcome } from './planning/deviation/deviation-outcome';
export { DeviationReplanner } from './planning/deviation/deviation-replanner';
export { parseBalance } from './counter/balance-parser';
export {
  CounterRecalibrator,
  DEFAULT_RECALIBRATION_THRESHOLD,
  type Recalibration,
} from './counter/counter-recalibrator';
export type { CounterRepository } from './ports/counter-repository';
export type { PlanRepository } from './ports/plan-repository';
export type { WorkRulesSettingsRepository } from './ports/work-rules-settings-repository';
export { CalendarDate } from './calendar/calendar-date';
export { YearMonth } from './calendar/year-month';
export { SchoolWeeks } from './calendar/school-weeks';
export type { SchoolWeeksRepository } from './ports/school-weeks-repository';
export {
  planningPeriodDays,
  type PeriodStart,
  type PlanningPeriodRequest,
} from './calendar/planning-period';
export type { Clock } from './ports/clock';
export type { Notifier, ReminderDelivery } from './ports/notifier';
export type { ReminderSettingsRepository } from './ports/reminder-settings-repository';
export { ReminderSettings, type ReminderSettingsProps } from './reminders/reminder-settings';
export {
  DepartureReminderPlanner,
  type DepartureReminder,
  type DepartureReminderKind,
  type Moment,
} from './reminders/departure-reminder-planner';
export { WeekCheckPlanner } from './reminders/week-check-planner';
export { DefaultWeekPlanner } from './planning/default-week-planner';
export { PlanCanceller } from './planning/plan-canceller';
export { dayProgress, type DayProgress } from './planning/day-progress';
export { WeekObjectiveAdvisor, type ObjectiveSuggestion } from './planning/week-objective-advisor';
export { validatePlanningPreferences } from './planning/validate-planning-preferences';
export type { PlanningPreferencesRepository } from './ports/planning-preferences-repository';
export type {
  DatedDay,
  DatedPlan,
  PlannedRecovery,
  RecoveryApproval,
  RecoveryApprovalStatus,
  RecoveryPart,
} from './planning/dated-plan';
export { RecoveryApprovalPlanner } from './reminders/recovery-approval-planner';
export type { RecoveryApprovalQuestion, ScheduledReminder } from './reminders/scheduled-reminder';
export { RecoveryDayTimetable, type RecoveryDay } from './planning/recovery-day-timetable';
export { BalanceForecaster, type BalanceForecast } from './planning/balance-forecaster';
