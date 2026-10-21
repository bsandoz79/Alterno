import { InvalidValueError } from '../shared/domain-error';
import type { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import { DaySchedule } from './day-schedule';
import { WorkRules } from './work-rules';

/**
 * Les six heures qui délimitent les cinq plages d'une journée.
 * Saisir les bornes plutôt que les plages garantit qu'elles s'enchaînent sans trou.
 */
export interface DayTimes {
  /** Début de la plage variable du matin (arrivée au plus tôt, ex. 7h30). */
  readonly earliestArrival: TimeOfDay;
  /** Début de la plage fixe du matin (arrivée au plus tard, ex. 9h00). */
  readonly coreStart: TimeOfDay;
  /** Début de la plage de déjeuner (ex. 11h45). */
  readonly lunchStart: TimeOfDay;
  /** Fin de la plage de déjeuner (ex. 13h45). */
  readonly lunchEnd: TimeOfDay;
  /** Fin de la plage fixe de l'après-midi (départ au plus tôt, ex. 16h00). */
  readonly coreEnd: TimeOfDay;
  /** Fin de la plage variable du soir (départ au plus tard, ex. 18h15). */
  readonly latestDeparture: TimeOfDay;
}

/**
 * Réglages des règles horaires, tels que l'utilisateur les modifie dans l'app :
 * un groupe d'horaires pour le lundi au jeudi, un autre pour le vendredi.
 */
export interface WorkRulesSettings {
  readonly mondayToThursday: DayTimes;
  readonly friday: DayTimes;
  readonly minimumLunchBreak: Duration;
  readonly expectedDailyWork: Duration;
  readonly fullDayRecovery: Duration;
  readonly halfDayRecovery: Duration;
  /** Découvert autorisé au compteur (zéro : aucun découvert). */
  readonly maximumDeficit: Duration;
  /** Plafond du compteur ; `null` ou absent : pas de plafond. */
  readonly maximumCredit?: Duration | null;
}

/**
 * Construit les règles horaires à partir des réglages.
 *
 * @param settings - Réglages saisis (ou preset)
 * @returns Les règles, du lundi au vendredi
 * @throws {InvalidValueError} Si les heures d'un groupe ne se suivent pas, ou si les règles sont incohérentes
 *   (pause minimale plus longue que la plage de déjeuner, durée nulle, découvert négatif…)
 */
export function buildWorkRules(settings: WorkRulesSettings): WorkRules {
  const mondayToThursday = toSchedule('Lundi–jeudi', settings.mondayToThursday);
  const friday = toSchedule('Vendredi', settings.friday);
  return WorkRules.create({
    week: {
      monday: mondayToThursday,
      tuesday: mondayToThursday,
      wednesday: mondayToThursday,
      thursday: mondayToThursday,
      friday,
    },
    minimumLunchBreak: settings.minimumLunchBreak,
    expectedDailyWork: settings.expectedDailyWork,
    fullDayRecovery: settings.fullDayRecovery,
    halfDayRecovery: settings.halfDayRecovery,
    maximumDeficit: settings.maximumDeficit,
    ...(settings.maximumCredit == null ? {} : { maximumCredit: settings.maximumCredit }),
  });
}

/** Horaires d'un groupe de jours, après avoir vérifié que les six heures se suivent. */
function toSchedule(label: string, times: DayTimes): DaySchedule {
  const ordered = [
    times.earliestArrival,
    times.coreStart,
    times.lunchStart,
    times.lunchEnd,
    times.coreEnd,
    times.latestDeparture,
  ];
  const inOrder = ordered.every((time, index) => {
    const previous = ordered[index - 1];
    return previous === undefined || previous.isBefore(time);
  });
  if (!inOrder) {
    throw new InvalidValueError(
      `${label} : les heures doivent se suivre (arrivée au plus tôt, début de plage fixe, début et fin de pause, fin de plage fixe, départ au plus tard).`,
    );
  }
  return DaySchedule.create({
    flexibleArrival: TimeSlot.between(times.earliestArrival, times.coreStart),
    morningCore: TimeSlot.between(times.coreStart, times.lunchStart),
    lunchWindow: TimeSlot.between(times.lunchStart, times.lunchEnd),
    afternoonCore: TimeSlot.between(times.lunchEnd, times.coreEnd),
    flexibleDeparture: TimeSlot.between(times.coreEnd, times.latestDeparture),
  });
}
