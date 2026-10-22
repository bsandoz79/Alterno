/**
 * Couche application : cas d'usage (SimulatePlan, DeclareDeviation, RecalibrateCounter…).
 * Elle orchestre le domaine et ne dépend que de lui ; l'extérieur lui est fourni par injection.
 */
export {
  SimulatePlan,
  type ComparisonRequest,
  type PaceComparison,
  type RecoveryChoice,
  type SimulatedDay,
  type Simulation,
  type SimulationObjective,
  type SimulationRequest,
  type FixedDay,
} from './simulate-plan';
export {
  DeclareDeviation,
  type DatedDeviationOutcome,
  type DatedLateArrival,
  type DeviationRequest,
} from './declare-deviation';
export { paceStrategy, type PaceName } from './pace-name';
export { ForecastBalance } from './forecast-balance';
export { RecalibrateCounter } from './recalibrate-counter';
export { AnswerRecoveryApproval, type RecoveryAnswer } from './answer-recovery-approval';
export { CancelPlan, CancelRecovery } from './cancel-plan';
export { ChangeReminderSettings } from './change-reminder-settings';
export { PlanWithDefaultWeek, type DefaultWeekSources } from './plan-with-default-week';
export {
  ScheduleDepartureReminders,
  type ReminderScheduling,
} from './schedule-departure-reminders';
export { EditPlanDays, type PlanDaysEdit } from './edit-plan-days';
export { ValidatePlan } from './validate-plan';
