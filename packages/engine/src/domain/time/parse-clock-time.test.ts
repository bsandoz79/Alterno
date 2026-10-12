import { describe, expect, it } from 'vitest';

import { InvalidValueError } from '../shared/domain-error';
import { parseClockTime } from './parse-clock-time';

describe('parseClockTime — heure saisie par l’utilisateur', () => {
  it.each([
    ['7h30', '7h30'],
    ['07h30', '7h30'],
    ['7:30', '7h30'],
    ['07:30', '7h30'],
    ['18h', '18h00'],
    ['  9h00  ', '9h00'],
  ])('lit « %s » comme %s', (text, expected) => {
    expect(parseClockTime(text).format()).toBe(expected);
  });

  it.each(['', 'abc', '25h00', '7h75', '7h5', 'h30'])('refuse « %s »', (text) => {
    expect(() => parseClockTime(text)).toThrow(InvalidValueError);
  });

  it('cite la saisie et le format attendu dans le message', () => {
    expect(() => parseClockTime('abc')).toThrow(/« abc ».*7h30/);
  });
});
