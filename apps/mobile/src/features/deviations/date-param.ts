import { CalendarDate, DomainError } from '@alterno/engine';

/**
 * Lit la date passée dans l'adresse de l'écran (« /jour/2026-10-19 »).
 * L'adresse peut être tapée à la main sur le web : une valeur absente ou invalide donne `null`
 * pour que l'écran affiche un message plutôt que de planter.
 *
 * @param value - Paramètre de route tel que fourni par Expo Router
 * @returns La date, ou `null` si l'adresse ne contient pas une date valide
 */
export function parseDateParam(value: unknown): CalendarDate | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    return CalendarDate.fromIsoString(value);
  } catch (error) {
    if (error instanceof DomainError) {
      return null;
    }
    throw error;
  }
}
