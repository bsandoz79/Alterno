import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import { HoursCounter } from '../domain/counter/hours-counter';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { CounterRepository } from '../domain/ports/counter-repository';
import type { PlanRepository } from '../domain/ports/plan-repository';
import { laBrosseEtDupontRules } from '../domain/rules/presets/la-brosse-et-dupont';
import { Duration } from '../domain/time/duration';
import { ForecastBalance } from './forecast-balance';
import { SimulatePlan } from './simulate-plan';

const rules = laBrosseEtDupontRules();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const clockAt = (iso: string): Clock => ({ today: () => date(iso) });
const counterAt = (hours: number): CounterRepository => ({
  load: () => Promise.resolve(HoursCounter.of(Duration.ofHours(hours))),
  save: () => Promise.resolve(),
});
const plansWith = (plan: DatedPlan | null): PlanRepository => ({
  loadCurrent: () => Promise.resolve(plan),
  saveCurrent: () => Promise.resolve(),
});

/** Plan validé : récup le mercredi 21, préparée lundi et mardi. */
const recoveryPlan = new SimulatePlan(rules).execute({
  days: ['2026-10-19', '2026-10-20', '2026-10-21'].map(date),
  objective: { kind: 'recovery', date: date('2026-10-21'), recovery: 'full' },
  pace: 'steady',
  counter: HoursCounter.of(Duration.ofHours(7)),
});

describe('ForecastBalance — solde à venir sur l’écran Compteur', () => {
  it('déduit la récup prévue du compteur actuel', async () => {
    const forecast = await new ForecastBalance(
      rules,
      counterAt(7),
      plansWith(recoveryPlan),
      clockAt('2026-10-19'),
    ).execute();

    expect(forecast?.balance.format()).toBe('0h');
    expect(forecast?.until.toIsoString()).toBe('2026-10-21');
  });

  it('ne prévoit rien sans plan en cours', async () => {
    const forecast = await new ForecastBalance(
      rules,
      counterAt(7),
      plansWith(null),
      clockAt('2026-10-19'),
    ).execute();

    expect(forecast).toBeNull();
  });
});
