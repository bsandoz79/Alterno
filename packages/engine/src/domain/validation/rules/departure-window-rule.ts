import type { DayContext, RuleViolation, ScheduleRule } from '../schedule-rule';
import { isWithinInclusive } from './time-window';

/**
 * Le départ doit se situer dans la plage variable du soir
 * (16h00–18h15, 15h30–17h30 le vendredi chez La Brosse et Dupont).
 */
export class DepartureWindowRule implements ScheduleRule {
  readonly name = 'departure-window';

  check({ input, schedule }: DayContext): readonly RuleViolation[] {
    const window = schedule.flexibleDeparture;
    if (isWithinInclusive(input.departure, window)) {
      return [];
    }
    return [
      {
        rule: this.name,
        message: `Départ à ${input.departure.format()} : il doit se situer entre ${window.start.format()} et ${window.end.format()}.`,
      },
    ];
  }
}
