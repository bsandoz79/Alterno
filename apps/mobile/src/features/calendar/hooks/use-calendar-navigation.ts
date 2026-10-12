import type { CalendarDate, DatedPlan, YearMonth } from '@alterno/engine';
import { useState } from 'react';

import { buildMonth, monthOfWeek, type MonthView } from '../month-view';
import { monthNavigation, weekNavigation, type Navigation } from '../period-navigation';
import { selectWeek, weekAt, type WeekView } from '../week-view';

/** Vue affichée par l'écran calendrier. */
export type CalendarMode = 'week' | 'month';

/** État et actions de la navigation dans le calendrier. */
export interface CalendarNavigation {
  readonly mode: CalendarMode;
  readonly week: WeekView;
  readonly weekNavigation: Navigation<CalendarDate>;
  readonly month: MonthView;
  readonly monthNavigation: Navigation<YearMonth>;
  /** Change de vue ; la vue mois s'ouvre sur le mois de la semaine affichée. */
  readonly changeMode: (mode: CalendarMode) => void;
  /** Affiche, en vue semaine, la semaine contenant ce jour (flèches, ou appui sur un jour du mois). */
  readonly showWeek: (anyDay: CalendarDate) => void;
  /** Affiche ce mois en vue mois. */
  readonly showMonth: (month: YearMonth) => void;
}

/**
 * Navigation semaine par semaine et mois par mois dans le plan validé.
 * Tant que l'utilisateur n'a rien choisi, la semaine affichée est celle proposée par `selectWeek`
 * (aujourd'hui, ou la prochaine semaine planifiée) : rien n'est stocké, tout est recalculé.
 *
 * @param plan - Plan validé
 * @param today - Date du jour
 * @returns La période affichée, ses voisines et les actions pour se déplacer
 */
export function useCalendarNavigation(plan: DatedPlan, today: CalendarDate): CalendarNavigation {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [chosenMonday, setChosenMonday] = useState<CalendarDate | null>(null);
  const [chosenMonth, setChosenMonth] = useState<YearMonth | null>(null);

  const week = chosenMonday === null ? selectWeek(plan, today) : weekAt(plan, chosenMonday);
  const monthShown = chosenMonth ?? monthOfWeek(week.monday);

  return {
    mode,
    week,
    weekNavigation: weekNavigation(plan, week.monday),
    month: buildMonth(plan, monthShown),
    monthNavigation: monthNavigation(plan, monthShown),
    changeMode: (next) => {
      if (next === 'month') {
        setChosenMonth(monthOfWeek(week.monday));
      }
      setMode(next);
    },
    showWeek: (anyDay) => {
      setChosenMonday(anyDay.startOfWeek());
      setMode('week');
    },
    showMonth: (month) => {
      setChosenMonth(month);
      setMode('month');
    },
  };
}
