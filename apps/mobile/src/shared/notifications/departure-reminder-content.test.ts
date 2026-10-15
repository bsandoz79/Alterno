import { CalendarDate, TimeOfDay, type DepartureReminder } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { departureReminderContent, departureReminderTime } from './departure-reminder-content';

const reminder: DepartureReminder = {
  kind: 'before',
  date: CalendarDate.fromIsoString('2026-10-14'),
  at: TimeOfDay.of(17, 0),
  departure: TimeOfDay.of(17, 15),
};

describe('Rappel de départ', () => {
  it('annonce l’heure de départ et le temps restant', () => {
    expect(departureReminderContent(reminder)).toEqual({
      title: 'Bientôt l’heure de partir',
      body: 'Départ prévu à 17h15 (dans 15 min).',
      data: { url: '/' },
    });
  });

  it('au-delà d’une heure, donne le délai en heures', () => {
    expect(departureReminderContent({ ...reminder, at: TimeOfDay.of(15, 45) }).body).toBe(
      'Départ prévu à 17h15 (dans 1h30).',
    );
  });

  it('à l’heure de départ, demande si on part plus tard et ouvre la saisie du départ', () => {
    const question: DepartureReminder = {
      ...reminder,
      kind: 'at-departure',
      at: TimeOfDay.of(17, 15),
    };

    expect(departureReminderContent(question)).toEqual({
      title: 'C’est l’heure de partir',
      body: 'Départ prévu à 17h15. Tu pars plus tard ? Touche ici pour le signaler.',
      data: { url: '/jour/2026-10-14?change=late-departure' },
    });
  });

  it('se déclenche à l’heure locale du rappel, ce jour-là', () => {
    const time = departureReminderTime(reminder);

    expect([time.getFullYear(), time.getMonth(), time.getDate()]).toEqual([2026, 9, 14]);
    expect([time.getHours(), time.getMinutes()]).toEqual([17, 0]);
  });
});
