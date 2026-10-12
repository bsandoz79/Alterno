import { createContext, useContext } from 'react';

import type { Repositories } from './repositories';

/** Contexte React qui met les dépôts à disposition des hooks des features. */
export const RepositoriesContext = createContext<Repositories | null>(null);

/**
 * Donne accès aux dépôts de données depuis un hook de feature.
 *
 * @returns Les dépôts de la plateforme courante (SQLite sur téléphone, navigateur sur web)
 * @throws {Error} Si appelé en dehors de `RepositoriesProvider` (erreur de câblage de l'app)
 */
export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (repositories === null) {
    throw new Error('useRepositories doit être utilisé à l’intérieur de RepositoriesProvider.');
  }
  return repositories;
}
