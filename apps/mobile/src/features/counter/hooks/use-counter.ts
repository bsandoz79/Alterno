import { RecalibrateCounter, parseBalance, type HoursCounter } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { previewRecalibration, type RecalibrationPreview } from '../recalibration-form';

/** État et actions de l'écran « Mon compteur ». */
export interface CounterState {
  /** `null` pendant le chargement. */
  readonly counter: HoursCounter | null;
  /** Solde Smart RH en cours de saisie. */
  readonly input: string;
  readonly setInput: (value: string) => void;
  readonly preview: RecalibrationPreview | null;
  /** Enregistre le solde saisi comme nouveau compteur. */
  readonly recalibrate: () => Promise<void>;
  readonly message: FormMessage | null;
}

/**
 * Relie l'écran au compteur enregistré et au cas d'usage `RecalibrateCounter`.
 * Le compteur est rechargé à chaque affichage (une simulation ou un écart a pu le changer).
 *
 * @returns L'état de l'écran
 */
export function useCounter(): CounterState {
  const { counter: counters } = useRepositories();
  const [counter, setCounter] = useState<HoursCounter | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void counters.load().then((loaded) => {
        if (active) {
          setCounter(loaded);
        }
      });
      return () => {
        active = false;
      };
    }, [counters]),
  );

  const preview = useMemo(
    () => (counter === null ? null : previewRecalibration(counter, input)),
    [counter, input],
  );

  const recalibrate = useCallback(async () => {
    if (preview?.ok !== true) {
      return;
    }
    const applied = await new RecalibrateCounter(counters).execute(parseBalance(input));
    setCounter(applied.counter);
    setInput('');
    setMessage({
      kind: 'success',
      text: `Compteur recalé sur Smart RH : ${applied.counter.format()} (correction ${applied.adjustment.format({ signed: true })}).`,
    });
  }, [preview, counters, input]);

  return {
    counter,
    input,
    setInput: (value) => {
      setInput(value);
      setMessage(null);
    },
    preview,
    recalibrate,
    message,
  };
}
