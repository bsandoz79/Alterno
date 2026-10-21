import {
  CalendarDate,
  TimeOfDay,
  type DepartureReminder,
  type Notifier,
  type ScheduledReminder,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { DeferredNotifier } from './deferred-notifier';
import { SilentNotifier } from './silent-notifier';

const reminder: DepartureReminder = {
  kind: 'before',
  date: CalendarDate.fromIsoString('2026-10-19'),
  at: TimeOfDay.of(17, 0),
  departure: TimeOfDay.of(17, 15),
};

describe('Notificateurs', () => {
  it('ne charge le vrai notificateur qu’une fois, au premier rappel, puis lui confie les rappels', async () => {
    const received: (readonly ScheduledReminder[])[] = [];
    let loads = 0;
    const notifier = new DeferredNotifier(() => {
      loads += 1;
      const real: Notifier = {
        replaceReminders: (reminders) => {
          received.push(reminders);
          return Promise.resolve('not-allowed');
        },
      };
      return Promise.resolve(real);
    });

    expect(loads).toBe(0);
    const first = await notifier.replaceReminders([reminder]);
    await notifier.replaceReminders([]);

    expect(first).toBe('not-allowed');

    expect(loads).toBe(1);
    expect(received).toEqual([[reminder], []]);
  });

  it('le notificateur silencieux ignore les rappels et le signale', async () => {
    const silent: Notifier = new SilentNotifier();

    await expect(silent.replaceReminders([reminder])).resolves.toBe('unsupported');
  });
});
