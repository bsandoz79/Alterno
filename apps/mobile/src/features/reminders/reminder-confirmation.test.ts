import { describe, expect, it } from 'vitest';

import { reminderConfirmation } from './reminder-confirmation';

const delays = { approvalFirstDelayDays: 2, approvalRepeatDays: 1 };
const all = { lead: 5, atDeparture: true, weekCheck: true, approvalCheck: true, ...delays };
const none = { lead: 0, atDeparture: false, weekCheck: false, approvalCheck: false, ...delays };

describe('Confirmation du réglage validé', () => {
  it('résume le réglage et le nombre de notifications programmées', () => {
    expect(reminderConfirmation(all, { count: 6, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Réglé : rappel 5 min avant le départ, question à l’heure de départ, question de fin de semaine et suivi de la récup. 6 notifications programmées.',
    });
  });

  it('accorde au singulier et décrit un rappel seul', () => {
    expect(
      reminderConfirmation({ ...none, lead: 15 }, { count: 1, delivery: 'scheduled' }).text,
    ).toBe('Réglé : rappel 15 min avant le départ. 1 notification programmée.');
  });

  it('décrit une question seule, sans départ à venir', () => {
    expect(
      reminderConfirmation({ ...none, atDeparture: true }, { count: 0, delivery: 'scheduled' })
        .text,
    ).toBe(
      'Réglé : question à l’heure de départ. Aucun départ à venir dans ton plan pour l’instant.',
    );
  });

  it('décrit la question de fin de semaine seule', () => {
    expect(
      reminderConfirmation({ ...none, weekCheck: true }, { count: 1, delivery: 'scheduled' }).text,
    ).toBe('Réglé : question de fin de semaine. 1 notification programmée.');
  });

  it('confirme la désactivation complète', () => {
    expect(reminderConfirmation(none, { count: 0, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Notifications désactivées.',
    });
  });

  it('explique comment autoriser les notifications refusées par Android', () => {
    expect(reminderConfirmation(all, { count: 6, delivery: 'not-allowed' })).toEqual({
      kind: 'error',
      text: 'Réglage enregistré, mais Android bloque les notifications d’Alterno : autorise-les dans Paramètres → Applications → Alterno → Notifications.',
    });
  });

  it('précise où les notifications s’affichent quand elles ne sont pas prises en charge ici', () => {
    expect(reminderConfirmation(all, { count: 6, delivery: 'unsupported' }).kind).toBe('info');
  });
});
