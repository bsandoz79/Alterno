import { AnswerRecoveryApproval, type PlannedRecovery, type RecoveryAnswer } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { answerConfirmation } from '../recovery-answer';

/** État de l'écran « Ma récup » et action de réponse. */
export interface RecoveryApprovalState {
  /** Récup du plan en cours ; `null` sans récup, `undefined` pendant le chargement. */
  readonly recovery: PlannedRecovery | null | undefined;
  /** Enregistre la réponse (cas d'usage `AnswerRecoveryApproval`). */
  readonly answer: (answer: RecoveryAnswer) => Promise<void>;
  /** Confirmation après une réponse. */
  readonly message: FormMessage | null;
}

/**
 * Charge la récup du plan en cours et enregistre la réponse au suivi.
 * Une réponse venue d'un bouton de la notification (dans l'adresse) est enregistrée dès l'ouverture.
 *
 * @param answerFromNotification - Réponse portée par l'adresse, ou `null`
 * @returns La récup, l'action de réponse et la confirmation
 */
export function useRecoveryApproval(
  answerFromNotification: RecoveryAnswer | null,
): RecoveryApprovalState {
  const { plans } = useRepositories();
  const [recovery, setRecovery] = useState<PlannedRecovery | null | undefined>(undefined);
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void plans.loadCurrent().then((plan) => {
        if (active) {
          setRecovery(plan?.recovery ?? null);
        }
      });
      return () => {
        active = false;
      };
    }, [plans]),
  );

  const answer = useCallback(
    async (value: RecoveryAnswer) => {
      const approval = await new AnswerRecoveryApproval(plans).execute(value);
      const plan = await plans.loadCurrent();
      setRecovery(plan?.recovery ?? null);
      setMessage(
        approval === null || plan?.recovery === undefined
          ? null
          : answerConfirmation(value, plan.recovery.date),
      );
    },
    [plans],
  );

  // Répondre deux fois la même chose ne change rien : relancer à chaque nouvelle adresse suffit.
  useEffect(() => {
    if (answerFromNotification !== null) {
      void answer(answerFromNotification);
    }
  }, [answerFromNotification, answer]);

  return { recovery, answer, message };
}
