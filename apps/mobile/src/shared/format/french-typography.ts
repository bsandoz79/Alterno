/**
 * Typographie française : l'espace avant « : ; ? ! » » et après « « » devient insécable,
 * pour qu'une ligne ne commence jamais par un signe de ponctuation isolé.
 *
 * @param text - Texte à afficher
 * @returns Le même texte, avec des espaces insécables
 */
export function withNonBreakingSpaces(text: string): string {
  return text.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
}
