import { laBrosseEtDupontSettings } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { parseWorkRulesForm, toWorkRulesForm } from './work-rules-form';

const presetForm = toWorkRulesForm(laBrosseEtDupontSettings());

describe('Formulaire des règles horaires', () => {
  it('affiche le preset au format français', () => {
    expect(presetForm.mondayToThursday.earliestArrival).toBe('7h30');
    expect(presetForm.friday.coreEnd).toBe('15h30');
    expect(presetForm.minimumLunchBreak).toBe('0h45');
    expect(presetForm.halfDayRecovery).toBe('3h30');
    expect(presetForm.maximumDeficit).toBe('4h');
  });

  it('relit un formulaire non modifié comme le preset', () => {
    const result = parseWorkRulesForm(presetForm);

    expect(result).toEqual({ ok: true, settings: laBrosseEtDupontSettings() });
  });

  it('accepte les heures saisies avec deux-points (« 17:00 »)', () => {
    const result = parseWorkRulesForm({
      ...presetForm,
      friday: { ...presetForm.friday, latestDeparture: '17:00' },
    });

    expect(result.ok && result.settings.friday.latestDeparture.format()).toBe('17h00');
  });

  it('nomme le champ invalide dans l’erreur', () => {
    const result = parseWorkRulesForm({
      ...presetForm,
      mondayToThursday: { ...presetForm.mondayToThursday, lunchStart: 'midi' },
    });

    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/Lundi–jeudi.*Début de la pause.*« midi »/) as unknown,
    });
  });

  it('nomme aussi un champ de durée invalide', () => {
    const result = parseWorkRulesForm({ ...presetForm, expectedDailyWork: 'sept heures' });

    expect(result.ok ? '' : result.error).toMatch(/Temps attendu par jour/);
  });

  it('accepte aucun découvert (« 0h ») et refuse un découvert négatif', () => {
    const none = parseWorkRulesForm({ ...presetForm, maximumDeficit: '0h' });
    const negative = parseWorkRulesForm({ ...presetForm, maximumDeficit: '-2h' });

    expect(none.ok && none.settings.maximumDeficit.isZero()).toBe(true);
    expect(negative.ok ? '' : negative.error).toMatch(/découvert/);
  });

  it('remonte les règles métier non respectées (heures dans le désordre)', () => {
    const result = parseWorkRulesForm({
      ...presetForm,
      friday: { ...presetForm.friday, coreStart: '7h00' },
    });

    expect(result.ok ? '' : result.error).toMatch(/Vendredi/);
  });
});
