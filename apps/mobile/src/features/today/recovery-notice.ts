import type { PlannedRecovery, RecoveryDay, TimeSlot } from '@alterno/engine';

/** Message de l'accueil un jour de repos compensatoire. */
export interface RecoveryNotice {
  readonly title: string;
  readonly text: string;
}

/**
 * Message de l'accueil le jour de la récup : « Repos compensatoire » dans les titres,
 * avec les horaires de travail et de repos pour une demi-journée.
 *
 * @param recovery - Récup posée par le plan
 * @param day - Horaires du jour de récup, `null` tant qu'ils ne sont pas calculés
 * @returns Le titre et le texte à afficher
 */
export function recoveryNotice(recovery: PlannedRecovery, day: RecoveryDay | null): RecoveryNotice {
  if (recovery.kind === 'full') {
    return { title: 'Repos compensatoire', text: 'Journée de repos : rien à faire aujourd’hui.' };
  }
  const title = 'Demi-journée de repos compensatoire';
  if (day?.kind !== 'half') {
    return { title, text: 'Demi-journée de repos aujourd’hui.' };
  }
  const worked = `travail ${span(day.worked)}`;
  const rest = `repos ${span(day.rest)}`;
  const [first, second] = day.part === 'morning' ? [rest, worked] : [worked, rest];
  return { title, text: `${capitalize(first)}, puis ${second}.` };
}

/** « de 9h00 à 12h30 ». */
function span(slot: TimeSlot): string {
  return `de ${slot.start.format()} à ${slot.end.format()}`;
}

/** Met la première lettre en majuscule (début de phrase). */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
