import {
  CounterRecalibrator,
  DomainError,
  parseBalance,
  type HoursCounter,
  type Recalibration,
} from '@alterno/engine';

/** Aperçu affiché sous le champ : la correction, ou l'erreur de saisie. */
export type RecalibrationPreview =
  | { readonly ok: true; readonly recalibration: Recalibration }
  | { readonly ok: false; readonly error: string };

const recalibrator = new CounterRecalibrator();

/**
 * Calcule l'aperçu du recalage pendant la saisie du solde Smart RH, sans rien enregistrer.
 *
 * @param current - Compteur actuel d'Alterno
 * @param input - Solde saisi, ex. « +2h15 »
 * @returns `null` tant que le champ est vide, sinon la correction ou un message d'erreur
 */
export function previewRecalibration(
  current: HoursCounter,
  input: string,
): RecalibrationPreview | null {
  if (input.trim() === '') {
    return null;
  }
  try {
    return { ok: true, recalibration: recalibrator.recalibrate(current, parseBalance(input)) };
  } catch (error) {
    // Saisie illisible : le message du moteur donne le format attendu.
    if (error instanceof DomainError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
