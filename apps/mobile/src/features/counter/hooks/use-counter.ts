import {
  RecalibrateCounter,
  buildWorkRules,
  laBrosseEtDupontSettings,
  parseBalance,
  type HoursCounter,
  type WorkRules,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { balanceStatus, type BalanceStatus } from '../balance-status';
import { previewRecalibration, type RecalibrationPreview } from '../recalibration-form';

/** État et actions de l'écran « Mon compteur ». */
export interface CounterState {
  /** `null` pendant le chargement. */
  readonly counter: HoursCounter | null;
  /** Avance, retard ou découvert dépassé ; `null` pendant le chargement. */
  readonly status: BalanceStatus | null;
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
 * Le compteur et les règles (découvert autorisé) sont rechargés à chaque affichage :
 * une simulation, un écart ou les réglages ont pu les changer.
 *
 * @returns L'état de l'écran
 */
export function useCounter(): CounterState {
  const { counter: counters, workRules } = useRepositories();
  const [counter, setCounter] = useState<HoursCounter | null>(null);
  const [rules, setRules] = useState<WorkRules | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<FormMessage | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([counters.load(), workRules.load()]).then(([loaded, settings]) => {
        if (active) {
          setCounter(loaded);
          setRules(buildWorkRules(settings ?? laBrosseEtDupontSettings()));
        }
      });
      return () => {
        active = false;
      };
    }, [counters, workRules]),
  );

  const preview = useMemo(
    () => (counter === null ? null : previewRecalibration(counter, input)),
    [counter, input],
  );

  const status = useMemo(
    () => (counter === null || rules === null ? null : balanceStatus(counter, rules)),
    [counter, rules],
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
    status,
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
