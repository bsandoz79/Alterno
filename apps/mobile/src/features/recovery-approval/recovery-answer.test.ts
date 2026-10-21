import { CalendarDate } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { answerConfirmation, parseAnswerParam } from './recovery-answer';

const friday = CalendarDate.fromIsoString('2026-10-30');

describe('Réponse au suivi de la récup', () => {
  it.each(['approved', 'refused', 'not-yet'] as const)(
    'lit la réponse « %s » de l’adresse',
    (answer) => {
      expect(parseAnswerParam(answer)).toBe(answer);
    },
  );

  it.each([undefined, '', 'peut-être', ['approved']])(
    'ignore une réponse absente ou invalide (%s)',
    (value) => {
      expect(parseAnswerParam(value)).toBeNull();
    },
  );

  it('confirme chaque réponse', () => {
    expect(answerConfirmation('approved', friday)).toEqual({
      kind: 'success',
      text: 'Récup du ven. 30 oct. acceptée.',
    });
    expect(answerConfirmation('refused', friday)).toEqual({
      kind: 'info',
      text: 'Récup du ven. 30 oct. refusée.',
    });
    expect(answerConfirmation('not-yet', friday)).toEqual({
      kind: 'info',
      text: 'D’accord, on te redemandera.',
    });
  });
});
