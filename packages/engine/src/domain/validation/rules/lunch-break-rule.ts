import type { DayContext, RuleViolation, ScheduleRule } from '../schedule-rule';
import { isWithinInclusive } from './time-window';

/**
 * La pause déjeuner doit durer au moins la pause minimale (45 min)
 * et être prise entièrement dans la plage de déjeuner (11h45–13h45).
 */
export class LunchBreakRule implements ScheduleRule {
  readonly name = 'lunch-break';

  check({ input, schedule, rules }: DayContext): readonly RuleViolation[] {
    const violations: RuleViolation[] = [];
    const lunchBreak = input.lunchBreak;
    const window = schedule.lunchWindow;

    const duration = lunchBreak.duration();
    if (duration.isLessThan(rules.minimumLunchBreak)) {
      violations.push({
        rule: this.name,
        message: `Pause de ${duration.format()} : ${rules.minimumLunchBreak.format()} minimum.`,
      });
    }

    if (
      !isWithinInclusive(lunchBreak.start, window) ||
      !isWithinInclusive(lunchBreak.end, window)
    ) {
      violations.push({
        rule: this.name,
        message: `La pause doit être prise entre ${window.start.format()} et ${window.end.format()} (prévue ${lunchBreak.format()}).`,
      });
    }

    return violations;
  }
}
