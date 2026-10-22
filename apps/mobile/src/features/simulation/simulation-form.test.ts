import { CalendarDate, Duration, HoursCounter, TimeOfDay, TimeSlot } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SIMULATION_FORM, toSimulationRequest } from './simulation-form';

const days = ['2026-10-19', '2026-10-20', '2026-10-21'].map((iso) =>
  CalendarDate.fromIsoString(iso),
);
const counter = HoursCounter.zero();

describe('Formulaire de simulation', () => {
  it('propose par défaut : semaine prochaine, 1 semaine, objectif proposé, rythme régulier', () => {
    expect(DEFAULT_SIMULATION_FORM).toMatchObject({
      start: 'next-week',
      weeks: 1,
      objective: 'hours',
      target: '',
      pace: 'steady',
    });
  });

  it('sans objectif saisi, prend l’objectif proposé (reste à faire de la semaine)', () => {
    const result = toSimulationRequest(
      DEFAULT_SIMULATION_FORM,
      days,
      counter,
      Duration.ofHours(21),
    );

    expect(
      result.ok &&
        result.request.objective.kind === 'hours' &&
        result.request.objective.target.format(),
    ).toBe('21h');
  });

  it('sans objectif saisi ni proposé, demande d’en saisir un', () => {
    const result = toSimulationRequest(DEFAULT_SIMULATION_FORM, days, counter);

    expect(result.ok ? '' : result.error).toMatch(/Objectif d’heures/);
  });

  it('lit un objectif d’heures', () => {
    const result = toSimulationRequest(
      { ...DEFAULT_SIMULATION_FORM, target: '41h' },
      days,
      counter,
    );

    expect(result.ok && result.request.objective).toMatchObject({ kind: 'hours' });
    expect(
      result.ok &&
        result.request.objective.kind === 'hours' &&
        result.request.objective.target.format(),
    ).toBe('41h');
  });

  it('nomme le champ quand l’objectif est illisible', () => {
    const result = toSimulationRequest(
      { ...DEFAULT_SIMULATION_FORM, target: 'beaucoup' },
      days,
      counter,
    );

    expect(result.ok ? '' : result.error).toMatch(/Objectif d’heures.*« beaucoup »/);
  });

  it('demande de choisir le jour de la récup', () => {
    const result = toSimulationRequest(
      { ...DEFAULT_SIMULATION_FORM, objective: 'recovery' },
      days,
      counter,
    );

    expect(result.ok ? '' : result.error).toMatch(/jour de la récup/);
  });

  it('construit une demande de récup avec la date choisie', () => {
    const result = toSimulationRequest(
      {
        ...DEFAULT_SIMULATION_FORM,
        objective: 'recovery',
        recoveryDate: '2026-10-21',
        recoveryKind: 'half',
        recoveryPart: 'morning',
      },
      days,
      counter,
    );

    expect(result.ok && result.request.objective).toMatchObject({
      kind: 'recovery',
      recovery: 'half',
      part: 'morning',
    });
  });

  it('propose par défaut l’après-midi en repos pour une demi-journée', () => {
    expect(DEFAULT_SIMULATION_FORM.recoveryPart).toBe('afternoon');
  });

  it('transmet les jours modifiés de la période pour un objectif d’heures, pas pour une récup', () => {
    const times = {
      arrival: TimeOfDay.of(8, 0),
      lunchBreak: TimeSlot.between(TimeOfDay.of(12, 15), TimeOfDay.of(13, 0)),
      departure: TimeOfDay.of(16, 0),
    };
    const editedDays = { '2026-10-19': times, '2026-11-02': times };
    const hours = toSimulationRequest(
      { ...DEFAULT_SIMULATION_FORM, target: '35h', editedDays },
      days,
      counter,
    );
    const recovery = toSimulationRequest(
      { ...DEFAULT_SIMULATION_FORM, objective: 'recovery', recoveryDate: '2026-10-21', editedDays },
      days,
      counter,
    );

    expect(hours.ok && hours.request.fixedDays?.map((day) => day.date.toIsoString())).toEqual([
      '2026-10-19',
    ]);
    expect(recovery.ok && recovery.request.fixedDays).toBeUndefined();
  });
});
