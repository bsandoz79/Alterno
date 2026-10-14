import { describe, expect, it } from 'vitest';

import { reminderConfirmation } from './reminder-confirmation';

describe('Confirmation du rappel validé', () => {
  it('confirme le délai et le nombre de rappels programmés', () => {
    expect(reminderConfirmation(5, { count: 3, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Rappel réglé : 5 min avant le départ — 3 rappels programmés.',
    });
  });

  it('accorde au singulier un seul rappel', () => {
    expect(reminderConfirmation(15, { count: 1, delivery: 'scheduled' }).text).toBe(
      'Rappel réglé : 15 min avant le départ — 1 rappel programmé.',
    );
  });

  it('prévient quand aucun départ n’est à venir dans le plan', () => {
    expect(reminderConfirmation(15, { count: 0, delivery: 'scheduled' }).text).toBe(
      'Rappel réglé : 15 min avant le départ. Aucun départ à venir dans ton plan pour l’instant.',
    );
  });

  it('confirme la désactivation', () => {
    expect(reminderConfirmation(0, { count: 0, delivery: 'scheduled' })).toEqual({
      kind: 'success',
      text: 'Rappels désactivés.',
    });
  });

  it('explique comment autoriser les notifications refusées par Android', () => {
    expect(reminderConfirmation(5, { count: 3, delivery: 'not-allowed' })).toEqual({
      kind: 'error',
      text: 'Réglage enregistré, mais Android bloque les notifications d’Alterno : autorise-les dans Paramètres → Applications → Alterno → Notifications.',
    });
  });

  it('précise où les rappels s’affichent quand ils ne sont pas pris en charge ici', () => {
    expect(reminderConfirmation(5, { count: 3, delivery: 'unsupported' })).toEqual({
      kind: 'info',
      text: 'Réglage enregistré. Les rappels s’affichent dans l’application installée sur Android, pas dans Expo Go ni dans le navigateur.',
    });
  });
});
