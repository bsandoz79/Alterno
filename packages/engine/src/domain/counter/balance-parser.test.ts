import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { parseBalance } from './balance-parser';

describe('parseBalance — solde saisi depuis Smart RH', () => {
  it.each([
    ['+2h15', 135],
    ['-1h10', -70],
    ['0h05', 5],
    ['2h', 120],
    ['−0h50', -50],
    ['  +0h05  ', 5],
    ['12h30', 750],
  ])('lit « %s » comme %i minutes', (text, minutes) => {
    expect(parseBalance(text).toMinutes()).toBe(minutes);
  });

  it.each(['', 'abc', '2h75', 'h30', '2h5', '+-1h', '2:15'])('refuse « %s »', (text) => {
    expect(() => parseBalance(text)).toThrow(InvalidValueError);
  });

  it('explique le format attendu dans le message d’erreur', () => {
    expect(() => parseBalance('abc')).toThrow(/« abc ».*\+2h15/);
  });
});
