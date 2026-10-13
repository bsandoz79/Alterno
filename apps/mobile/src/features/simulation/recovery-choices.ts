import type { RecoveryChoice } from '@alterno/engine';

/**
 * Raison affichée pour un jour de récup barré : combien d'heures manquent.
 *
 * @param choice - Jour proposé et sa faisabilité
 * @returns Le message, ou `null` si la récup est possible ce jour-là
 */
export function unavailableReason(choice: RecoveryChoice): string | null {
  const { outlook } = choice;
  return outlook.reachable
    ? null
    : `Pas assez de cumul : il manque ${outlook.missing.format()}, même en faisant les journées les plus longues avant.`;
}

/**
 * Jour de récup réellement retenu : le choix de l'utilisateur, s'il est toujours proposé et possible
 * (changer de période ou passer de demi-journée à journée peut le rendre impossible).
 *
 * @param choices - Jours proposés
 * @param selected - Jour choisi (« AAAA-MM-JJ ») ou `null`
 * @returns Le jour retenu, ou `null`
 */
export function selectableRecoveryDate(
  choices: readonly RecoveryChoice[],
  selected: string | null,
): string | null {
  const choice = findChoice(choices, selected);
  return choice?.outlook.reachable === true ? selected : null;
}

/**
 * Avertissement quand la récup choisie est trop proche pour tout rattraper avant :
 * le reste est pris sur le découvert autorisé et devra être rattrapé ensuite.
 *
 * @param choices - Jours proposés
 * @param selected - Jour choisi (« AAAA-MM-JJ ») ou `null`
 * @returns Le message, ou `null` si aucun découvert n'est utilisé
 */
export function deficitNotice(
  choices: readonly RecoveryChoice[],
  selected: string | null,
): string | null {
  const outlook = findChoice(choices, selected)?.outlook;
  if (outlook?.reachable !== true || outlook.deficitAfter.isZero()) {
    return null;
  }
  return `Pas le temps de tout rattraper avant : ton compteur sera à ${outlook.deficitAfter.negate().format({ signed: true })} après la récup, à rattraper ensuite.`;
}

/** Le jour proposé qui correspond à la date choisie. */
function findChoice(
  choices: readonly RecoveryChoice[],
  selected: string | null,
): RecoveryChoice | undefined {
  return choices.find((choice) => choice.date.toIsoString() === selected);
}
