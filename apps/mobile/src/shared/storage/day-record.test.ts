import { describe, expect, it } from 'vitest';

import { fromDayRecords, type DayRecord } from './day-record';

const monday: DayRecord = {
  date: '2026-10-19',
  arrival: 480,
  lunchStart: 735,
  lunchEnd: 780,
  departure: 1017,
  worked: 492,
};

describe('fromDayRecords — relecture des journées enregistrées', () => {
  it('reconstruit la date et les horaires à partir des données brutes', () => {
    const plan = fromDayRecords([monday]);
    const first = plan.days[0];

    expect(first?.date.toIsoString()).toBe('2026-10-19');
    expect(first?.plan.day).toBe('monday');
    expect(first?.plan.arrival.format()).toBe('8h00');
    expect(first?.plan.lunchBreak.format()).toBe('12h15 – 13h00');
    expect(first?.plan.departure.format()).toBe('16h57');
    expect(plan.totalWorked.format()).toBe('8h12');
  });

  it('refuse une date invalide plutôt que de produire un plan faux', () => {
    expect(() => fromDayRecords([{ ...monday, date: '2026-13-01' }])).toThrow(/Date inexistante/);
  });
});
