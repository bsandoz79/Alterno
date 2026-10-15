import { describe, expect, it } from 'vitest';

import { notificationUrl } from './notification-url';

describe('Écran ouvert depuis une notification', () => {
  it('suit l’adresse interne rangée dans la notification', () => {
    expect(notificationUrl({ url: '/jour/2026-10-15?change=late-departure' })).toBe(
      '/jour/2026-10-15?change=late-departure',
    );
  });

  it.each([
    ['sans données', undefined],
    ['sans adresse', { other: 1 }],
    ['adresse non textuelle', { url: 42 }],
    ['adresse externe', { url: 'https://exemple.fr' }],
    ['adresse vers un autre site', { url: '//exemple.fr' }],
  ])('ignore une notification %s', (_case, data) => {
    expect(notificationUrl(data)).toBeNull();
  });
});
