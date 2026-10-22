import type { ArchivedDay, ArchivedDayKind, MonthSummary } from '@alterno/engine';

/** Barre du graphique du solde, à la fin d'un mois. */
export interface BalanceBar {
  readonly month: MonthSummary['month'];
  /** Hauteur, en fraction du plus grand écart affiché (0 à 1). */
  readonly ratio: number;
  /** `true` pour un solde positif (barre vers le haut, en vert). */
  readonly positive: boolean;
  readonly label: string;
}

/**
 * Courbe du compteur sous forme de barres : le solde cumulé à la fin de chaque mois,
 * à l'échelle du plus grand écart (positif ou négatif).
 *
 * @param months - Mois de l'historique
 * @returns Une barre par mois
 */
export function balanceBars(months: readonly MonthSummary[]): readonly BalanceBar[] {
  const largest = Math.max(0, ...months.map((month) => month.balanceAtEnd.abs().toMinutes()));
  return months.map((month) => ({
    month: month.month,
    ratio: largest === 0 ? 0 : month.balanceAtEnd.abs().toMinutes() / largest,
    positive: !month.balanceAtEnd.isNegative(),
    label: month.balanceAtEnd.format({ signed: true }),
  }));
}

/**
 * @param days - Récups prises, en journées (une demi-journée compte 0,5)
 * @returns « 1,5 j », ou un tiret s'il n'y en a pas
 */
export function recoveryLabel(days: number): string {
  return days === 0 ? '—' : `${String(days).replace('.', ',')} j`;
}

const KIND_LABELS: Readonly<Record<Exclude<ArchivedDayKind, 'work'>, string>> = {
  recovery: 'Récup',
  'half-recovery': '½ récup',
  school: 'École',
};

/**
 * @param day - Journée archivée
 * @returns Le temps travaillé et l'écart (« 8h12 (+1h12) »), le type de journée et son écart,
 *   ou seulement « École » (rien d'attendu ce jour-là)
 */
export function dayLine(day: ArchivedDay): string {
  const gap = day.worked.minus(day.expected);
  if (day.kind === 'school') {
    return KIND_LABELS.school;
  }
  const label = day.kind === 'work' ? day.worked.format() : KIND_LABELS[day.kind];
  return gap.isZero() ? label : `${label} (${gap.format({ signed: true })})`;
}
