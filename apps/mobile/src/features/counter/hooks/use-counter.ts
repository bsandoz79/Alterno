import {
  ForecastBalance,
  RecalibrateCounter,
  buildWorkRules,
  laBrosseEtDupontSettings,
  parseBalance,
  type BalanceForecast,
  type Clock,
  type HoursCounter,
  type WorkRules,
} from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { systemClock } from '@/shared/clock/system-clock';
import type { FormMessage } from '@/shared/components/message-box';
import { useRepositories } from '@/shared/storage/repositories-context';

import { balanceStatus, type BalanceStatus } from '../balance-status';
import { previewRecalibration, type RecalibrationPreview } from '../recalibration-form';
import { upcomingBalanceView, type UpcomingBalanceView } from '../upcoming-balance';

/** État et actions de l'écran « Mon compteur ». */
export interface CounterState {
  /** `null` pendant le chargement. */
  readonly counter: HoursCounter | null;
  /** Avance, retard ou découvert dépassé ; `null` pendant le chargement. */
  readonly status: BalanceStatus | null;
  /** Solde à la fin du plan en cours ; `null` sans plan en cours (ou plan terminé). */
  readonly upcoming: UpcomingBalanceView | null;
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
 * Le compteur, les règles (découvert autorisé) et le solde à venir (cas d'usage `ForecastBalance`)
 * sont rechargés à chaque affichage : une simulation, un écart ou les réglages ont pu les changer.
 *
 * @param clock - Horloge (l'horloge système par défaut ; une horloge fixe en test)
 * @returns L'état de l'écran
 */
export function useCounter(clock: Clock = systemClock): CounterState {
  const { counter: counters, workRules, plans } = useRepositories();
  const [counter, setCounter] = useState<HoursCounter | null>(null);
  const [rules, setRules] = useState<WorkRules | null>(null);
  const [forecast, setForecast] = useState<BalanceForecast | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<FormMessage | null>(null);

  /** Recharge le compteur, les règles et le solde à venir ; ignoré si l'écran a été quitté entre-temps. */
  const load = useCallback(
    async (isActive: () => boolean) => {
      const [loaded, settings] = await Promise.all([counters.load(), workRules.load()]);
      const loadedRules = buildWorkRules(settings ?? laBrosseEtDupontSettings());
      const upcoming = await new ForecastBalance(loadedRules, counters, plans, clock).execute();
      if (isActive()) {
        setCounter(loaded);
        setRules(loadedRules);
        setForecast(upcoming);
      }
    },
    [counters, workRules, plans, clock],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  const preview = useMemo(
    () => (counter === null ? null : previewRecalibration(counter, input)),
    [counter, input],
  );

  const status = useMemo(
    () => (counter === null || rules === null ? null : balanceStatus(counter, rules)),
    [counter, rules],
  );
  const upcoming = useMemo(
    () => (forecast === null || rules === null ? null : upcomingBalanceView(forecast, rules)),
    [forecast, rules],
  );

  const recalibrate = useCallback(async () => {
    if (preview?.ok !== true) {
      return;
    }
    const applied = await new RecalibrateCounter(counters).execute(parseBalance(input));
    setInput('');
    // Le solde à venir part du compteur : il est recalculé avec le nouveau solde.
    await load(() => true);
    setMessage({
      kind: 'success',
      text: `Compteur recalé sur Smart RH : ${applied.counter.format()} (correction ${applied.adjustment.format({ signed: true })}).`,
    });
  }, [preview, counters, input, load]);

  return {
    counter,
    status,
    upcoming,
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
