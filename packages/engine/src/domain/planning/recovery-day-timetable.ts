import type { WorkRules } from '../rules/work-rules';
import type { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { PlannedRecovery, RecoveryPart } from './dated-plan';

/**
 * Horaires d'un jour de repos compensatoire :
 * - journée complète : toute la journée est en repos ;
 * - demi-journée : une partie travaillée (sans pause déjeuner) et une partie en repos.
 */
export type RecoveryDay =
  | { readonly kind: 'full' }
  | {
      readonly kind: 'half';
      readonly part: RecoveryPart;
      readonly worked: TimeSlot;
      readonly rest: TimeSlot;
    };

/**
 * Calcule les horaires d'un jour de récup à partir des règles horaires : rien n'est stocké
 * en plus de la moitié choisie, les horaires suivent donc les règles en vigueur.
 *
 * Demi-journée : on travaille le temps attendu moins la valeur de la demi-journée
 * (7h − 3h30 = 3h30), sans pause puisqu'on part avant ou arrive après le déjeuner.
 * - Après-midi en repos : travail dès le début de la plage fixe du matin (9h00–12h30),
 *   puis repos de la durée de la demi-journée (12h30–16h00).
 * - Matin en repos : travail jusqu'à la fin de la plage fixe de l'après-midi (12h30–16h00,
 *   15h30 le vendredi), précédé du repos.
 * Dans les deux cas, la partie travaillée couvre au moins la plage fixe de sa moitié.
 */
export class RecoveryDayTimetable {
  /**
   * @param rules - Règles horaires (plages, temps attendu, valeur de la demi-journée)
   */
  constructor(private readonly rules: WorkRules) {}

  /**
   * @param recovery - Récup posée par le plan
   * @returns Les horaires du jour de récup
   * @throws {InvalidValueError} Si le jour n'est pas travaillé, ou si la demi-journée vaut au moins une journée attendue
   */
  dayOf(recovery: PlannedRecovery): RecoveryDay {
    if (recovery.kind === 'full') {
      return { kind: 'full' };
    }
    const part = recovery.part ?? 'afternoon';
    const schedule = this.rules.scheduleFor(recovery.date.weekday());
    const workLength = this.rules.expectedDailyWork.minus(this.rules.halfDayRecovery);
    const restLength = this.rules.halfDayRecovery;

    if (part === 'afternoon') {
      // Présence obligatoire sur la plage fixe du matin : le travail finit au plus tôt à sa fin.
      const end = latest(schedule.morningCore.start.plus(workLength), schedule.morningCore.end);
      const worked = TimeSlot.between(end.plus(workLength.negate()), end);
      return { kind: 'half', part, worked, rest: TimeSlot.between(end, end.plus(restLength)) };
    }
    // Présence obligatoire sur la plage fixe de l'après-midi : le travail commence au plus tard à son début.
    const start = earliest(
      schedule.afternoonCore.end.plus(workLength.negate()),
      schedule.afternoonCore.start,
    );
    const worked = TimeSlot.between(start, start.plus(workLength));
    return {
      kind: 'half',
      part,
      worked,
      rest: TimeSlot.between(start.plus(restLength.negate()), start),
    };
  }
}

/** La plus tardive des deux heures. */
function latest(a: TimeOfDay, b: TimeOfDay): TimeOfDay {
  return a.isAfter(b) ? a : b;
}

/** La plus matinale des deux heures. */
function earliest(a: TimeOfDay, b: TimeOfDay): TimeOfDay {
  return a.isBefore(b) ? a : b;
}
