import { CalendarDate, TimeOfDay, TimeSlot, type RecoveryDay } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { recoveryNotice } from './recovery-notice';

const date = CalendarDate.fromIsoString('2026-10-22');
const slot = (from: string, to: string): TimeSlot =>
  TimeSlot.between(TimeOfDay.parse(from), TimeOfDay.parse(to));

describe('Accueil un jour de repos compensatoire', () => {
  it('journée complète : repos toute la journée', () => {
    expect(recoveryNotice({ date, kind: 'full' }, { kind: 'full' })).toEqual({
      title: 'Repos compensatoire',
      text: 'Journée de repos : rien à faire aujourd’hui.',
    });
  });

  it('après-midi en repos : le travail du matin, puis le repos', () => {
    const day: RecoveryDay = {
      kind: 'half',
      part: 'afternoon',
      worked: slot('09:00', '12:30'),
      rest: slot('12:30', '16:00'),
    };

    expect(recoveryNotice({ date, kind: 'half', part: 'afternoon' }, day)).toEqual({
      title: 'Demi-journée de repos compensatoire',
      text: 'Travail de 9h00 à 12h30, puis repos de 12h30 à 16h00.',
    });
  });

  it('matin en repos : le repos, puis le travail de l’après-midi', () => {
    const day: RecoveryDay = {
      kind: 'half',
      part: 'morning',
      worked: slot('12:30', '16:00'),
      rest: slot('09:00', '12:30'),
    };

    expect(recoveryNotice({ date, kind: 'half', part: 'morning' }, day).text).toBe(
      'Repos de 9h00 à 12h30, puis travail de 12h30 à 16h00.',
    );
  });

  it('pendant le chargement des horaires : annonce simplement la demi-journée', () => {
    expect(recoveryNotice({ date, kind: 'half' }, null).text).toBe(
      'Demi-journée de repos aujourd’hui.',
    );
  });
});
