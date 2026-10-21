import { useCallback, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { eraseMyData } from '../erase-my-data';
import { exportMyData } from '../my-data-export';
import { shareExport } from '../share-export';

/** Actions de la page « Mes données » et message de résultat. */
export interface MyDataState {
  /** Exporte toutes les données en JSON (partage sur Android, téléchargement sur le web). */
  readonly exportData: () => Promise<void>;
  /** Efface toutes les données : l'app repart comme au premier lancement. */
  readonly eraseAll: () => Promise<void>;
  readonly message: FormMessage | null;
}

/**
 * Relie la page « Mes données » à l'export et à l'effacement (RGPD).
 *
 * @returns Les deux actions et le message à afficher
 */
export function useMyData(): MyDataState {
  const repositories = useRepositories();
  const [message, setMessage] = useState<FormMessage | null>(null);

  const exportData = useCallback(async () => {
    const today = systemClock.today();
    const exported = await exportMyData(repositories, today);
    await shareExport(
      `alterno-mes-donnees-${today.toIsoString()}.json`,
      JSON.stringify(exported, null, 2),
    );
    setMessage({ kind: 'success', text: 'Export prêt.' });
  }, [repositories]);

  const eraseAll = useCallback(async () => {
    await eraseMyData(repositories);
    setMessage({ kind: 'success', text: 'Tout est effacé.' });
  }, [repositories]);

  return { exportData, eraseAll, message };
}
