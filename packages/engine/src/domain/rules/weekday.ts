/**
 * Jours de la semaine, du lundi au dimanche.
 * Codés en anglais (convention du code) ; `WEEKDAY_LABELS` fournit le libellé français
 * utilisé dans les messages d'erreur du domaine.
 */
export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/** Un jour de la semaine. */
export type Weekday = (typeof WEEKDAYS)[number];

/** Libellés français des jours, pour les messages. */
export const WEEKDAY_LABELS: Readonly<Record<Weekday, string>> = {
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
  sunday: 'dimanche',
};
