import { describe, expect, it } from 'vitest';

import { fromDayRecords, type DayRecord } from './day-record';

const monday: DayRecord = {
  weekday: 'monday',
  arrival: 480,
  lunchStart: 735,
  lunchEnd: 780,
  departure: 1017,
  worked: 492,
};

describe('fromDayRecords — relecture des journées enregistrées', () => {
  it('reconstruit les horaires à partir des minutes depuis minuit', () => {
    const plan = fromDayRecords([monday]);

    expect(plan.days[0]?.arrival.format()).toBe('8h00');
    expect(plan.days[0]?.lunchBreak.format()).toBe('12h15 – 13h00');
    expect(plan.days[0]?.departure.format()).toBe('16h57');
    expect(plan.totalWorked.format()).toBe('8h12');
  });

  it('refuse un jour inconnu plutôt que de produire un plan faux', () => {
    expect(() => fromDayRecords([{ ...monday, weekday: 'lundi' }])).toThrow(/lundi/);
  });
});
