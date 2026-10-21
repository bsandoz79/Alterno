import { describe, expect, it } from 'vitest';

import { notificationTarget } from './notification-target';
import { RECOVERY_APPROVAL_ACTIONS } from './recovery-approval-category';
import { WEEK_CHECK_ACTIONS } from './week-check-category';

describe('Écran ouvert depuis une notification ou l’un de ses boutons', () => {
  it('« Oui » valide la semaine : rien à corriger, retour à l’accueil', () => {
    expect(notificationTarget(WEEK_CHECK_ACTIONS.confirm, { url: '/semaine' })).toBe('/');
  });

  it('« Corriger » ouvre la semaine pour signaler les écarts', () => {
    expect(notificationTarget(WEEK_CHECK_ACTIONS.correct, { url: '/semaine' })).toBe('/semaine');
  });

  it.each([
    ['Oui', RECOVERY_APPROVAL_ACTIONS.approved, '/recup?answer=approved'],
    ['Non', RECOVERY_APPROVAL_ACTIONS.refused, '/recup?answer=refused'],
    ['Pas encore', RECOVERY_APPROVAL_ACTIONS.notYet, '/recup?answer=not-yet'],
  ])(
    'suivi de la récup : « %s » ouvre l’écran de la récup avec la réponse',
    (_label, action, url) => {
      expect(notificationTarget(action, { url: '/recup' })).toBe(url);
    },
  );

  it('toucher la notification ouvre l’écran qu’elle désigne', () => {
    expect(
      notificationTarget('expo.modules.notifications.actions.DEFAULT', {
        url: '/jour/2026-10-23?change=late-departure',
      }),
    ).toBe('/jour/2026-10-23?change=late-departure');
  });

  it('ignore une notification sans adresse valide', () => {
    expect(notificationTarget('expo.modules.notifications.actions.DEFAULT', {})).toBeNull();
  });
});
