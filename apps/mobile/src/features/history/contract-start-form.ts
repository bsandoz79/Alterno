import { CalendarDate, DomainError } from '@alterno/engine';

/** Résultat de la saisie du début du contrat. */
export type ContractStartResult =
  | { readonly ok: true; readonly date: CalendarDate }
  | { readonly ok: false; readonly error: string };

const FRENCH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * Lit une date tapée au format français (JJ/MM/AAAA).
 *
 * @param value - Saisie de l'utilisateur
 * @returns La date, ou un message qui donne le format attendu
 */
export function parseContractStart(value: string): ContractStartResult {
  const error = `« ${value.trim()} » n’est pas une date valide (ex. 01/10/2026).`;
  const match = FRENCH_DATE.exec(value.trim());
  if (match === null) {
    return { ok: false, error };
  }
  const [, day, month, year] = match;
  try {
    return { ok: true, date: CalendarDate.of(Number(year), Number(month), Number(day)) };
  } catch (caught) {
    // Date impossible (31 février…) : refusée par le moteur.
    if (caught instanceof DomainError) {
      return { ok: false, error };
    }
    throw caught;
  }
}

/**
 * @param date - Date enregistrée
 * @returns La date au format JJ/MM/AAAA
 */
export function formatContractStart(date: CalendarDate): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(date.day)}/${pad(date.month)}/${String(date.year)}`;
}
