import { InvalidValueError } from '../shared/domain-error';
import { TimeOfDay } from './time-of-day';

// Heures, séparateur « h » ou « : », puis minutes sur deux chiffres (facultatives après « h ») :
// « 7h30 », « 07:30 », « 18h ».
const CLOCK_TIME_PATTERN = /^(\d{1,2})(?:h(\d{2})?|:(\d{2}))$/;

/**
 * Lit une heure saisie par l'utilisateur, au format français (« 7h30 ») ou numérique (« 07:30 »).
 *
 * @param text - Saisie de l'utilisateur
 * @returns L'heure correspondante
 * @throws {InvalidValueError} Si la saisie ne respecte pas le format ou sort de 00h00–23h59
 */
export function parseClockTime(text: string): TimeOfDay {
  const trimmed = text.trim();
  const match = CLOCK_TIME_PATTERN.exec(trimmed);
  if (match === null) {
    throw new InvalidValueError(
      `Heure invalide : « ${trimmed} » (attendu par exemple 7h30 ou 07:30).`,
    );
  }
  // Les minutes viennent du groupe « h » ou du groupe « : » ; « 18h » signifie 18h00.
  const minutes = match[2] ?? match[3] ?? '0';
  return TimeOfDay.of(Number(match[1]), Number(minutes));
}
