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
export { WorkRules, type WorkRulesProps, type WeekSchedule } from './rules/work-rules';
export { laBrosseEtDupontRules } from './rules/presets/la-brosse-et-dupont';
