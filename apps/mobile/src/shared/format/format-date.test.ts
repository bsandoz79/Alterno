import { CalendarDate, YearMonth } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { formatLongDate, formatMonth, formatShortDate } from './format-date';

const friday = CalendarDate.fromIsoString('2026-10-16');

describe('Affichage des dates en français', () => {
  it('format court pour les listes : « ven. 16 oct. »', () => {
    expect(formatShortDate(friday)).toBe('ven. 16 oct.');
  });

  it('format long pour les titres : « Vendredi 16 octobre »', () => {
    expect(formatLongDate(friday)).toBe('Vendredi 16 octobre');
  });

  it('gère le mois de mai sans abréviation', () => {
    expect(formatShortDate(CalendarDate.fromIsoString('2026-05-04'))).toBe('lun. 4 mai');
  });

  it('nom du mois pour la vue mois : « Octobre 2026 »', () => {
    expect(formatMonth(YearMonth.of(2026, 10))).toBe('Octobre 2026');
  });
});
