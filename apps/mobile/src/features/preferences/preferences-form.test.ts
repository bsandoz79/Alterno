import { TimeOfDay, TimeSlot, laBrosseEtDupontRules } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { EMPTY_DAY_FORM, parsePreferencesForm, toPreferencesForm } from './preferences-form';

const rules = laBrosseEtDupontRules();
const emptyForm = toPreferencesForm({});

describe('Formulaire des préférences par jour', () => {
  it('affiche les habitudes par défaut et des jours vides tant que rien n’est réglé', () => {
    expect(emptyForm.defaults).toEqual({ arrival: '8h00', lunchStart: '12h15', lunchEnd: '13h00' });
    expect(emptyForm.days.monday).toEqual(EMPTY_DAY_FORM);
  });

  it('remplit le formulaire depuis des préférences enregistrées', () => {
    const form = toPreferencesForm({
      days: { wednesday: { latestDeparture: TimeOfDay.of(17, 0), exactlyExpected: true } },
    });

    expect(form.days.wednesday).toEqual({
      ...EMPTY_DAY_FORM,
      latestDeparture: '17h00',
      exactlyExpected: true,
    });
  });

  it('ne garde que les champs remplis pour chaque jour', () => {
    const result = parsePreferencesForm(
      { ...emptyForm, days: { ...emptyForm.days, monday: { ...EMPTY_DAY_FORM, arrival: '8h30' } } },
      rules,
    );

    expect(result.ok && result.preferences.days).toEqual({
      monday: { arrival: TimeOfDay.of(8, 30) },
    });
  });

  it('lit une pause propre à un jour', () => {
    const result = parsePreferencesForm(
      {
        ...emptyForm,
        days: {
          ...emptyForm.days,
          friday: { ...EMPTY_DAY_FORM, lunchStart: '12h00', lunchEnd: '12:45' },
        },
      },
      rules,
    );

    expect(result.ok && result.preferences.days?.friday?.lunchBreak).toEqual(
      TimeSlot.between(TimeOfDay.of(12, 0), TimeOfDay.of(12, 45)),
    );
  });

  it('demande les deux bornes de la pause', () => {
    const result = parsePreferencesForm(
      {
        ...emptyForm,
        days: { ...emptyForm.days, tuesday: { ...EMPTY_DAY_FORM, lunchStart: '12h00' } },
      },
      rules,
    );

    expect(result.ok ? '' : result.error).toMatch(/Mardi.*début et la fin de la pause/);
  });

  it('nomme le jour et le champ quand une heure est illisible', () => {
    const result = parsePreferencesForm(
      { ...emptyForm, days: { ...emptyForm.days, monday: { ...EMPTY_DAY_FORM, arrival: 'tôt' } } },
      rules,
    );

    expect(result.ok ? '' : result.error).toMatch(/Lundi · Arrivée.*« tôt »/);
  });

  it('remonte le refus du moteur pour une préférence hors des plages', () => {
    const result = parsePreferencesForm(
      { ...emptyForm, days: { ...emptyForm.days, monday: { ...EMPTY_DAY_FORM, arrival: '9h30' } } },
      rules,
    );

    expect(result.ok ? '' : result.error).toMatch(/lundi.*9h30/);
  });
});
