import {
  CalendarDate,
  Duration,
  HoursCounter,
  laBrosseEtDupontRules,
  type BalanceForecast,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { upcomingBalanceView } from './upcoming-balance';

const rules = laBrosseEtDupontRules();
const forecastOf = (minutes: number, includesRecovery: boolean): BalanceForecast => ({
  balance: HoursCounter.of(Duration.ofMinutes(minutes)),
  until: CalendarDate.fromIsoString('2026-10-23'),
  includesRecovery,
});

describe('Solde à venir', () => {
  it('donne le solde et la date de fin du plan, récup comprise', () => {
    expect(upcomingBalanceView(forecastOf(210, true), rules)).toEqual({
      value: '+3h30',
      tone: 'ahead',
      detail: 'À la fin de ton plan (ven. 23 oct.), récup comprise',
      alert: null,
    });
  });

  it('sans récup prévue, ne parle que de la fin du plan', () => {
    expect(upcomingBalanceView(forecastOf(0, false), rules)).toMatchObject({
      tone: 'even',
      detail: 'À la fin de ton plan (ven. 23 oct.)',
    });
  });

  it('dans le découvert : solde négatif, sans alerte', () => {
    expect(upcomingBalanceView(forecastOf(-240, true), rules)).toMatchObject({
      tone: 'behind',
      alert: null,
    });
  });

  it('alerte si le plan mène au-delà du découvert autorisé', () => {
    expect(upcomingBalanceView(forecastOf(-270, true), rules).alert).toBe(
      'Ce plan te mène au-delà du découvert autorisé (4h).',
    );
  });
});
