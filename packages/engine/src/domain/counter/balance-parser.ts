import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';

const MINUTES_PER_HOUR = 60;
// Signe facultatif (« + », « - » ou le vrai signe moins « − » copié depuis une page web), heures, « h »,
// puis minutes sur deux chiffres facultatives : « +2h15 », « -1h10 », « 2h ».
const BALANCE_PATTERN = /^([+\-−])?(\d{1,3})h(\d{2})?$/;

/**
 * Lit un solde d'heures saisi par l'utilisateur, tel qu'affiché par Smart RH.
 *
 * @param text - Saisie de l'utilisateur, par exemple « +2h15 », « -0h30 » ou « 2h »
 * @returns La durée signée correspondante
 * @throws {InvalidValueError} Si la saisie ne respecte pas le format ou si les minutes dépassent 59
 */
export function parseBalance(text: string): Duration {
  const trimmed = text.trim();
  const match = BALANCE_PATTERN.exec(trimmed);
  const hours = Number(match?.[2]);
  const minutes = Number(match?.[3] ?? '0');
  if (match === null || minutes >= MINUTES_PER_HOUR) {
    throw new InvalidValueError(
      `Solde invalide : « ${trimmed} » (attendu par exemple +2h15, -0h30 ou 2h).`,
    );
  }
  const magnitude = Duration.ofHours(hours, minutes);
  const isNegative = match[1] === '-' || match[1] === '−';
  return isNegative ? magnitude.negate() : magnitude;
}
