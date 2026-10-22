import { CalendarDate } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { formatContractStart, parseContractStart } from './contract-start-form';

describe('Début du contrat — saisie JJ/MM/AAAA', () => {
  it('lit une date française', () => {
    const result = parseContractStart('01/10/2026');

    expect(result.ok && result.date.toIsoString()).toBe('2026-10-01');
  });

  it('accepte un seul chiffre pour le jour et le mois', () => {
    const result = parseContractStart(' 1/9/2026 ');

    expect(result.ok && result.date.toIsoString()).toBe('2026-09-01');
  });

  it('refuse une saisie illisible ou une date qui n’existe pas', () => {
    expect(parseContractStart('octobre').ok).toBe(false);
    expect(parseContractStart('31/02/2026').ok).toBe(false);
  });

  it('affiche une date enregistrée au même format', () => {
    expect(formatContractStart(CalendarDate.fromIsoString('2026-10-01'))).toBe('01/10/2026');
  });
});
