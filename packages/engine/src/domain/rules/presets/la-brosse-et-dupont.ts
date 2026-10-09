import { Duration } from '../../time/duration';
import { TimeOfDay } from '../../time/time-of-day';
import { TimeSlot } from '../../time/time-slot';
import { DaySchedule } from '../day-schedule';
import { WorkRules } from '../work-rules';

const slot = (start: string, end: string): TimeSlot =>
  TimeSlot.between(TimeOfDay.parse(start), TimeOfDay.parse(end));

/**
 * Règles horaires de La Brosse et Dupont, configuration par défaut d'Alterno.
 *
 * - Plage variable 7h30–9h00, plage fixe 9h00–11h45, déjeuner 11h45–13h45 (45 min de pause minimum)
 * - Plage fixe 13h45–16h00 (15h30 le vendredi), plage variable 16h00–18h15 (15h30–17h30 le vendredi)
 * - 7h attendues par jour ; une récupération vaut 7h, une demi-journée 3h30
 *
 * @returns Les règles de l'entreprise, du lundi au vendredi
 */
export function laBrosseEtDupontRules(): WorkRules {
  const mondayToThursday = DaySchedule.create({
    flexibleArrival: slot('07:30', '09:00'),
    morningCore: slot('09:00', '11:45'),
    lunchWindow: slot('11:45', '13:45'),
    afternoonCore: slot('13:45', '16:00'),
    flexibleDeparture: slot('16:00', '18:15'),
  });

  // Le vendredi, la plage fixe de l'après-midi finit à 15h30 et le départ au plus tard est à 17h30.
  const friday = DaySchedule.create({
    flexibleArrival: slot('07:30', '09:00'),
    morningCore: slot('09:00', '11:45'),
    lunchWindow: slot('11:45', '13:45'),
    afternoonCore: slot('13:45', '15:30'),
    flexibleDeparture: slot('15:30', '17:30'),
  });

  return WorkRules.create({
    week: {
      monday: mondayToThursday,
      tuesday: mondayToThursday,
      wednesday: mondayToThursday,
      thursday: mondayToThursday,
      friday,
    },
    minimumLunchBreak: Duration.ofMinutes(45),
    expectedDailyWork: Duration.ofHours(7),
    fullDayRecovery: Duration.ofHours(7),
    halfDayRecovery: Duration.ofHours(3, 30),
  });
}
