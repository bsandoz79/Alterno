import type { TimeFieldName } from './day-edit-form';

/**
 * Changements proposés par le bouton « Signaler un changement » de l'accueil.
 * L'absence n'en fait pas partie en V1 (journée neutre, prévue après la V1).
 */
export type ChangeKind = 'late-arrival' | 'early-departure' | 'late-departure' | 'longer-lunch';

/** Choix rapide : libellé du bouton, question posée et seule heure à saisir. */
export interface ChangeChoice {
  readonly kind: ChangeKind;
  readonly label: string;
  readonly question: string;
  readonly field: TimeFieldName;
}

/**
 * Les choix rapides, dans l'ordre d'affichage. Chacun ne demande qu'une heure :
 * c'est la « saisie en deux taps » du cahier des charges (le choix, puis l'heure réelle).
 */
export const CHANGE_KINDS: readonly ChangeChoice[] = [
  {
    kind: 'late-arrival',
    label: 'Arrivé plus tard',
    question: 'À quelle heure es-tu arrivé ?',
    field: 'arrival',
  },
  {
    kind: 'early-departure',
    label: 'Parti plus tôt',
    question: 'À quelle heure es-tu parti ?',
    field: 'departure',
  },
  {
    // Aussi ouvert depuis la notification à l'heure de départ (« tu pars plus tard ? »).
    kind: 'late-departure',
    label: 'Parti plus tard',
    question: 'À quelle heure es-tu parti ?',
    field: 'departure',
  },
  {
    kind: 'longer-lunch',
    label: 'Pause plus longue',
    question: 'À quelle heure as-tu repris ?',
    field: 'lunchEnd',
  },
];

const ALL_FIELDS: readonly TimeFieldName[] = ['arrival', 'lunchStart', 'lunchEnd', 'departure'];

/**
 * @param change - Changement signalé, ou `null` pour une modification libre (depuis le planning)
 * @returns Les heures à afficher dans le formulaire
 */
export function changeFields(change: ChangeKind | null): readonly TimeFieldName[] {
  const choice = CHANGE_KINDS.find((candidate) => candidate.kind === change);
  return choice === undefined ? ALL_FIELDS : [choice.field];
}

/**
 * Lit le type de changement passé dans l'adresse (« /jour/2026-10-19?change=early-departure »).
 *
 * @param value - Paramètre de route
 * @returns Le changement, ou `null` s'il est absent ou inconnu
 */
export function parseChangeKind(value: unknown): ChangeKind | null {
  return CHANGE_KINDS.find((choice) => choice.kind === value)?.kind ?? null;
}
