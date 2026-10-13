import { CalendarDate, Duration, type RecoveryChoice } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { deficitNotice, selectableRecoveryDate, unavailableReason } from './recovery-choices';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const possible = (iso: string, deficitAfter = Duration.zero()): RecoveryChoice => ({
  date: date(iso),
  outlook: { reachable: true, catchUp: Duration.ofHours(3), deficitAfter },
});
const impossible = (iso: string, missing: Duration): RecoveryChoice => ({
  date: date(iso),
  outlook: { reachable: false, missing },
});

describe('Jours proposés pour la récup', () => {
  it('explique pourquoi un jour est barré, avec les heures qui manquent', () => {
    expect(unavailableReason(impossible('2026-10-14', Duration.ofHours(2, 30)))).toBe(
      'Pas assez de cumul : il manque 2h30, même en faisant les journées les plus longues avant.',
    );
  });

  it('n’explique rien pour un jour possible', () => {
    expect(unavailableReason(possible('2026-10-15'))).toBeNull();
  });

  it('garde le jour choisi tant qu’il est possible', () => {
    const choices = [impossible('2026-10-14', Duration.ofHours(1)), possible('2026-10-15')];

    expect(selectableRecoveryDate(choices, '2026-10-15')).toBe('2026-10-15');
  });

  it('oublie un jour choisi devenu impossible ou sorti de la période', () => {
    const choices = [impossible('2026-10-14', Duration.ofHours(1)), possible('2026-10-15')];

    expect(selectableRecoveryDate(choices, '2026-10-14')).toBeNull();
    expect(selectableRecoveryDate(choices, '2026-10-30')).toBeNull();
    expect(selectableRecoveryDate(choices, null)).toBeNull();
  });

  it('prévient quand la récup puise dans le découvert', () => {
    const choices = [possible('2026-10-14', Duration.ofHours(1))];

    expect(deficitNotice(choices, '2026-10-14')).toBe(
      'Pas le temps de tout rattraper avant : ton compteur sera à -1h après la récup, à rattraper ensuite.',
    );
  });

  it('ne prévient pas quand tout est rattrapé avant, ou sans jour choisi', () => {
    expect(deficitNotice([possible('2026-10-14')], '2026-10-14')).toBeNull();
    expect(deficitNotice([possible('2026-10-14', Duration.ofHours(1))], null)).toBeNull();
  });
});
