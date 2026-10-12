import type { CalendarDate, Weekday, YearMonth } from '@alterno/engine';

const SHORT_DAYS: Readonly<Record<Weekday, string>> = {
  monday: 'lun.',
  tuesday: 'mar.',
  wednesday: 'mer.',
  thursday: 'jeu.',
  friday: 'ven.',
  saturday: 'sam.',
  sunday: 'dim.',
};

const LONG_DAYS: Readonly<Record<Weekday, string>> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

// Abréviations usuelles en français : les mois courts (mai, juin, août) ne sont pas abrégés.
const SHORT_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

const LONG_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/**
 * Date courte pour les listes, ex. « ven. 16 oct. ».
 * Formatage fait à la main plutôt qu'avec Intl : le rendu reste identique sur Android et sur le web.
 *
 * @param date - Date à afficher
 * @returns La date lisible
 */
export function formatShortDate(date: CalendarDate): string {
  return `${SHORT_DAYS[date.weekday()]} ${String(date.day)} ${SHORT_MONTHS[date.month - 1] ?? ''}`;
}

/**
 * Date longue pour les titres, ex. « Vendredi 16 octobre ».
 *
 * @param date - Date à afficher
 * @returns La date lisible
 */
export function formatLongDate(date: CalendarDate): string {
  return `${LONG_DAYS[date.weekday()]} ${String(date.day)} ${LONG_MONTHS[date.month - 1] ?? ''}`;
}

/**
 * Mois pour l'en-tête de la vue mois, ex. « Octobre 2026 ».
 *
 * @param month - Mois à afficher
 * @returns Le mois lisible, avec une majuscule
 */
export function formatMonth(month: YearMonth): string {
  const name = LONG_MONTHS[month.month - 1] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${String(month.year)}`;
}
