import { describe, expect, it } from 'vitest';

import { reminderConfirmation } from './reminder-confirmation';

const both = { lead: 5, atDeparture: true };

describe('Confirmation du réglage validé', () => {
  it('résume le réglage et le nombre de notifications programmées', () => {
    expect(reminderConfirmation(both, { count: 6, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Réglé : rappel 5 min avant le départ et question à l’heure de départ. 6 notifications programmées.',
    });
  });

  it('accorde au singulier et décrit un rappel seul', () => {
    expect(
      reminderConfirmation({ lead: 15, atDeparture: false }, { count: 1, delivery: 'scheduled' })
        .text,
    ).toBe('Réglé : rappel 15 min avant le départ. 1 notification programmée.');
  });

  it('décrit une question seule, sans départ à venir', () => {
    expect(
      reminderConfirmation({ lead: 0, atDeparture: true }, { count: 0, delivery: 'scheduled' })
        .text,
    ).toBe(
      'Réglé : question à l’heure de départ. Aucun départ à venir dans ton plan pour l’instant.',
    );
  });

  it('confirme la désactivation complète', () => {
    expect(
      reminderConfirmation({ lead: 0, atDeparture: false }, { count: 0, delivery: 'scheduled' }),
    ).toEqual({ kind: 'success', text: 'Notifications de départ désactivées.' });
  });

  it('explique comment autoriser les notifications refusées par Android', () => {
    expect(reminderConfirmation(both, { count: 6, delivery: 'not-allowed' })).toEqual({
      kind: 'error',
      text: 'Réglage enregistré, mais Android bloque les notifications d’Alterno : autorise-les dans Paramètres → Applications → Alterno → Notifications.',
    });
  });

  it('précise où les notifications s’affichent quand elles ne sont pas prises en charge ici', () => {
    expect(reminderConfirmation(both, { count: 6, delivery: 'unsupported' }).kind).toBe('info');
  });
});
