import type { DayContext, RuleViolation, ScheduleRule } from '../schedule-rule';
import { isWithinInclusive } from './time-window';

/** L'arrivée doit se situer dans la plage variable du matin (7h30–9h00 chez La Brosse et Dupont). */
export class ArrivalWindowRule implements ScheduleRule {
  readonly name = 'arrival-window';

  check({ input, schedule }: DayContext): readonly RuleViolation[] {
    const window = schedule.flexibleArrival;
    if (isWithinInclusive(input.arrival, window)) {
      return [];
    }
    return [
      {
        rule: this.name,
        message: `Arrivée à ${input.arrival.format()} : elle doit se situer entre ${window.start.format()} et ${window.end.format()}.`,
      },
    ];
  }
}
