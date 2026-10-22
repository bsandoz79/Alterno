import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../domain/calendar/calendar-date';
import type { ArchivedDay } from '../domain/history/archived-day';
import type { ContractStartRepository } from '../domain/ports/contract-start-repository';
import { Duration } from '../domain/time/duration';
import { LoadHistory } from './load-history';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const worked = (iso: string, hours: number): ArchivedDay => ({
  date: date(iso),
  kind: 'work',
  worked: Duration.ofHours(hours),
  expected: Duration.ofHours(7),
});

const contract = (
  start: CalendarDate | null,
): ContractStartRepository & { start: CalendarDate | null } => {
  const repository = {
    start,
    load: () => Promise.resolve(repository.start),
    save: (value: CalendarDate) => {
      repository.start = value;
      return Promise.resolve();
    },
  };
  return repository;
};

describe('LoadHistory — archiver puis résumer', () => {
  it('archive d’abord, puis résume depuis le début du contrat', async () => {
    const steps: string[] = [];
    const days = [worked('2026-09-30', 8), worked('2026-10-01', 9)];
    const history = await new LoadHistory(
      {
        execute: () => {
          steps.push('archive');
          return Promise.resolve();
        },
      },
      {
        loadAll: () => {
          steps.push('load');
          return Promise.resolve(days);
        },
        save: () => Promise.resolve(),
      },
      contract(date('2026-10-01')),
    ).execute();

    expect(steps).toEqual(['archive', 'load']);
    expect(history.contractStart?.toIsoString()).toBe('2026-10-01');
    expect(history.summary.total.balance.format({ signed: true })).toBe('+2h');
  });
});
