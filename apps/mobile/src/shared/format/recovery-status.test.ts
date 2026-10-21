import { CalendarDate, TimeOfDay, type PlannedRecovery } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { recoveryStatusText } from './recovery-status';

const recovery = (status?: 'pending' | 'approved' | 'refused'): PlannedRecovery => ({
  date: CalendarDate.fromIsoString('2026-10-30'),
  kind: 'full',
  ...(status === undefined
    ? {}
    : {
        approval: {
          status,
          requestedOn: CalendarDate.fromIsoString('2026-10-19'),
          requestedAt: TimeOfDay.of(9, 0),
        },
      }),
});

describe('Statut de la demande de récup', () => {
  it.each([
    ['pending', 'Repos compensatoire du ven. 30 oct. : demande en cours'],
    ['approved', 'Repos compensatoire du ven. 30 oct. : acceptée'],
    ['refused', 'Repos compensatoire du ven. 30 oct. : refusée'],
  ] as const)('décrit une demande %s', (status, text) => {
    expect(recoveryStatusText(recovery(status))).toBe(text);
  });

  it('n’affiche rien sans suivi (plan validé avant ALT-55)', () => {
    expect(recoveryStatusText(recovery())).toBeNull();
  });
});
