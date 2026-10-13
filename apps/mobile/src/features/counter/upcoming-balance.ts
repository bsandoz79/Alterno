import type { BalanceForecast, WorkRules } from '@alterno/engine';

import { formatShortDate } from '@/shared/format/format-date';

import { balanceStatus, type BalanceTone } from './balance-status';

/** Ce que la carte « Solde à venir » affiche. */
export interface UpcomingBalanceView {
  readonly value: string;
  readonly tone: BalanceTone;
  /** Jusqu'à quand, et si la récup est déduite. */
  readonly detail: string;
  /** Alerte si le plan fait dépasser le découvert autorisé, sinon `null`. */
  readonly alert: string | null;
}

/**
 * Prépare l'affichage du solde prévu à la fin du plan en cours.
 *
 * @param forecast - Prévision du moteur
 * @param rules - Règles horaires (découvert autorisé)
 * @returns Le texte et le ton de la carte
 */
export function upcomingBalanceView(
  forecast: BalanceForecast,
  rules: WorkRules,
): UpcomingBalanceView {
  const { tone } = balanceStatus(forecast.balance, rules);
  const end = `À la fin de ton plan (${formatShortDate(forecast.until)})`;
  return {
    value: forecast.balance.format(),
    tone,
    detail: forecast.includesRecovery ? `${end}, récup comprise` : end,
    alert:
      tone === 'beyond-deficit'
        ? `Ce plan te mène au-delà du découvert autorisé (${rules.maximumDeficit.format()}).`
        : null,
  };
}
