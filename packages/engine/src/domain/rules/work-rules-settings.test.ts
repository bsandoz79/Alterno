import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { laBrosseEtDupontSettings } from './presets/la-brosse-et-dupont';
import { buildWorkRules, type WorkRulesSettings } from './work-rules-settings';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);
const preset = laBrosseEtDupontSettings();

describe('buildWorkRules — règles construites depuis les réglages', () => {
  it('reproduit le preset La Brosse et Dupont : journées mini et maxi', () => {
    const rules = buildWorkRules(preset);

    expect(rules.minimumWorkedTime('monday').format()).toBe('5h');
    expect(rules.maximumWorkedTime('thursday').format()).toBe('10h');
    expect(rules.minimumWorkedTime('friday').format()).toBe('4h30');
    expect(rules.maximumWorkedTime('friday').format()).toBe('9h15');
  });

  it('applique le groupe « lundi–jeudi » du lundi au jeudi et le groupe « vendredi » au vendredi', () => {
    const rules = buildWorkRules({
      ...preset,
      mondayToThursday: { ...preset.mondayToThursday, latestDeparture: at('19:00') },
    });

    expect(rules.scheduleFor('wednesday').latestDeparture.format()).toBe('19h00');
    expect(rules.scheduleFor('friday').latestDeparture.format()).toBe('17h30');
  });

  it('ne fait travailler ni le samedi ni le dimanche', () => {
    expect(buildWorkRules(preset).workingDays()).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
    ]);
  });

  it('prend en compte la pause minimale et le temps attendu réglés', () => {
    const rules = buildWorkRules({
      ...preset,
      minimumLunchBreak: Duration.ofMinutes(30),
      expectedDailyWork: Duration.ofHours(7, 30),
    });

    expect(rules.minimumLunchBreak.format()).toBe('0h30');
    expect(rules.expectedDailyWork.format()).toBe('7h30');
  });

  it('refuse des heures dans le désordre en nommant le groupe concerné', () => {
    const shuffled: WorkRulesSettings = {
      ...preset,
      friday: { ...preset.friday, coreStart: at('07:00') },
    };

    expect(() => buildWorkRules(shuffled)).toThrow(InvalidValueError);
    expect(() => buildWorkRules(shuffled)).toThrow(/Vendredi/);
  });

  it('transmet les autres contrôles des règles (pause minimale plus longue que la plage de déjeuner)', () => {
    expect(() => buildWorkRules({ ...preset, minimumLunchBreak: Duration.ofHours(3) })).toThrow(
      /pause minimale/,
    );
  });
});
