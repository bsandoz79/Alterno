/**
 * Écran à ouvrir quand on touche une notification : l'adresse rangée dans ses données.
 * Seules les adresses internes à l'app (« /… ») sont suivies.
 *
 * @param data - Données de la notification touchée
 * @returns L'adresse à ouvrir, ou `null` si elle est absente ou invalide
 */
export function notificationUrl(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('url' in data)) {
    return null;
  }
  const { url } = data;
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : null;
}
