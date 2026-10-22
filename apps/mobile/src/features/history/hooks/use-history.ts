import { LoadHistory, type LoadedHistory } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { parseContractStart } from '../contract-start-form';

/** État et actions de l'écran Historique. */
export interface HistoryState {
  /** `null` pendant le chargement. */
  readonly history: LoadedHistory | null;
  /** Enregistre le début du contrat tapé (JJ/MM/AAAA), puis recharge l'historique. */
  readonly saveContractStart: (value: string) => Promise<void>;
  readonly message: FormMessage | null;
}

/**
 * Relie l'écran Historique au cas d'usage `LoadHistory` : à chaque affichage, les journées passées
 * sont archivées (hier compris) puis résumées par mois.
 *
 * @returns L'état de l'écran
 */
export function useHistory(): HistoryState {
  const { archiving, archive, contractStart } = useRepositories();
  const [history, setHistory] = useState<LoadedHistory | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void new LoadHistory(archiving, archive, contractStart).execute().then((loaded) => {
        if (active) {
          setHistory(loaded);
        }
      });
      return () => {
        active = false;
      };
      // `version` recharge l'historique après avoir changé le début du contrat.
    }, [archiving, archive, contractStart, version]),
  );

  const saveContractStart = useCallback(
    async (value: string) => {
      const result = parseContractStart(value);
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error });
        return;
      }
      await contractStart.save(result.date);
      setMessage({ kind: 'success', text: 'Début du contrat enregistré.' });
      setVersion((current) => current + 1);
    },
    [contractStart],
  );

  return { history, saveContractStart, message };
}
