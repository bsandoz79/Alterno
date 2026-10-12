import { describe, expect, it } from 'vitest';

import { parseDateParam } from './date-param';

describe('parseDateParam — date lue dans l’adresse de l’écran (/jour/2026-10-19)', () => {
  it('lit une date au format AAAA-MM-JJ', () => {
    expect(parseDateParam('2026-10-19')?.toIsoString()).toBe('2026-10-19');
  });

  it.each([[undefined], ['hier'], ['2026-02-30'], [['2026-10-19', '2026-10-20']]])(
    'renvoie null pour une adresse invalide (%j)',
    (value) => {
      expect(parseDateParam(value)).toBeNull();
    },
  );
});
