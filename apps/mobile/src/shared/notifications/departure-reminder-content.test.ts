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

  it('en fin de semaine, demande si la semaine s’est passée comme prévu, avec les boutons Oui / Corriger', () => {
    const check: DepartureReminder = {
      ...reminder,
      kind: 'week-check',
      at: TimeOfDay.of(18, 15),
    };

    expect(departureReminderContent(check)).toEqual({
      title: 'Fin de semaine',
      body: 'Ta semaine s’est passée comme prévu ?',
      data: { url: '/semaine' },
      categoryIdentifier: 'weekcheck',
    });
  });

  it('demande si la récup a été acceptée, avec les boutons Oui / Non / Pas encore', () => {
    expect(
      departureReminderContent({
        kind: 'recovery-approval',
        date: CalendarDate.fromIsoString('2026-10-21'),
        at: TimeOfDay.of(9, 0),
        recoveryDate: CalendarDate.fromIsoString('2026-10-30'),
      }),
    ).toEqual({
      title: 'Ta récup a-t-elle été acceptée ?',
      body: 'Repos compensatoire du ven. 30 oct. : réponds Oui, Non ou Pas encore.',
      data: { url: '/recup' },
      categoryIdentifier: 'recoveryapproval',
    });
  });

  it('se déclenche à l’heure locale du rappel, ce jour-là', () => {
    const time = departureReminderTime(reminder);

    expect([time.getFullYear(), time.getMonth(), time.getDate()]).toEqual([2026, 9, 14]);
    expect([time.getHours(), time.getMinutes()]).toEqual([17, 0]);
  });
});
