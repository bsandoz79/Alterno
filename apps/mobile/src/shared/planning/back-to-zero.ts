import type { HoursCounter } from '@alterno/engine';

/** Valeur du paramètre `objectif` de la simulation pour proposer directement « Revenir à 0 ». */
export const BACK_TO_ZERO_PARAM = 'zero';

/**
 * @param counter - Compteur actuel
 * @returns `true` s'il est négatif : un plan pour revenir à 0 mérite d'être proposé
 */
export function needsBackToZero(counter: HoursCounter): boolean {
  return counter.balance.isNegative();
}

/**
 * @param param - Paramètre `objectif` de l'adresse (texte, liste ou absent)
 * @returns `true` si la simulation a été ouverte pour revenir à 0
 */
export function isBackToZeroRequest(param: string | readonly string[] | undefined): boolean {
  return typeof param === 'string'
    ? param === BACK_TO_ZERO_PARAM
    : param?.[0] === BACK_TO_ZERO_PARAM;
}
