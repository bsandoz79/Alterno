import { Duration } from '../../time/duration';
import { TimeOfDay } from '../../time/time-of-day';
import type { WorkRules } from '../work-rules';
import { buildWorkRules, type WorkRulesSettings } from '../work-rules-settings';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

/**
 * Réglages de La Brosse et Dupont, configuration par défaut d'Alterno.
 *
 * - Plage variable 7h30–9h00, plage fixe 9h00–11h45, déjeuner 11h45–13h45 (45 min de pause minimum)
 * - Plage fixe 13h45–16h00 (15h30 le vendredi), plage variable 16h00–18h15 (15h30–17h30 le vendredi)
 * - 7h attendues par jour ; une récupération vaut 7h, une demi-journée 3h30
 *
 * @returns Les réglages du preset, à afficher ou à modifier dans l'app
 */
export function laBrosseEtDupontSettings(): WorkRulesSettings {
  return {
    mondayToThursday: {
      earliestArrival: at('07:30'),
      coreStart: at('09:00'),
      lunchStart: at('11:45'),
      lunchEnd: at('13:45'),
      coreEnd: at('16:00'),
      latestDeparture: at('18:15'),
    },
    // Le vendredi, la plage fixe de l'après-midi finit à 15h30 et le départ au plus tard est à 17h30.
    friday: {
      earliestArrival: at('07:30'),
      coreStart: at('09:00'),
      lunchStart: at('11:45'),
      lunchEnd: at('13:45'),
      coreEnd: at('15:30'),
      latestDeparture: at('17:30'),
    },
    minimumLunchBreak: Duration.ofMinutes(45),
    expectedDailyWork: Duration.ofHours(7),
    fullDayRecovery: Duration.ofHours(7),
    halfDayRecovery: Duration.ofHours(3, 30),
  };
}

/**
 * Règles horaires de La Brosse et Dupont, construites depuis leurs réglages.
 *
 * @returns Les règles de l'entreprise, du lundi au vendredi
 */
export function laBrosseEtDupontRules(): WorkRules {
  return buildWorkRules(laBrosseEtDupontSettings());
}
