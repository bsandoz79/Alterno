import { describe, expect, it } from 'vitest';

import { reminderConfirmation } from './reminder-confirmation';

const delays = { approvalFirstDelayDays: 2, approvalRepeatDays: 1 };
const all = { lead: 5, atDeparture: true, weekCheck: true, approvalCheck: true, ...delays };
const none = { lead: 0, atDeparture: false, weekCheck: false, approvalCheck: false, ...delays };

describe('Confirmation du réglage validé', () => {
  it('donne le nombre de notifications programmées', () => {
    expect(reminderConfirmation(all, { count: 6, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Enregistré · 6 notifications programmées.',
    });
  });

  it('accorde au singulier', () => {
    expect(
      reminderConfirmation({ ...none, lead: 15 }, { count: 1, delivery: 'scheduled' }).text,
    ).toBe('Enregistré · 1 notification programmée.');
  });

  it('dit quand rien n’est à venir', () => {
    expect(
      reminderConfirmation({ ...none, atDeparture: true }, { count: 0, delivery: 'scheduled' })
        .text,
    ).toBe('Enregistré · rien à venir pour l’instant.');
  });

  it('considère une seule question activée comme un réglage actif', () => {
    expect(
      reminderConfirmation({ ...none, approvalCheck: true }, { count: 0, delivery: 'scheduled' })
        .kind,
    ).toBe('success');
    expect(
      reminderConfirmation({ ...none, weekCheck: true }, { count: 1, delivery: 'scheduled' }).text,
    ).toBe('Enregistré · 1 notification programmée.');
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
