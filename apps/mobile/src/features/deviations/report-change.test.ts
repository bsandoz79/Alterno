import { describe, expect, it } from 'vitest';

import { CHANGE_KINDS, changeFields, parseChangeKind } from './report-change';

describe('Signaler un changement — choix rapides', () => {
  it('propose arrivé plus tard, parti plus tôt et pause plus longue, avec leur question', () => {
    expect(CHANGE_KINDS.map((change) => change.label)).toEqual([
      'Arrivé plus tard',
      'Parti plus tôt',
      'Pause plus longue',
    ]);
    expect(CHANGE_KINDS[1]?.question).toBe('À quelle heure es-tu parti ?');
  });

  it('n’affiche que l’heure concernée par le changement', () => {
    expect(changeFields('late-arrival')).toEqual(['arrival']);
    expect(changeFields('early-departure')).toEqual(['departure']);
    expect(changeFields('longer-lunch')).toEqual(['lunchEnd']);
  });

  it('affiche toutes les heures sans changement précis (modification depuis le planning)', () => {
    expect(changeFields(null)).toEqual(['arrival', 'lunchStart', 'lunchEnd', 'departure']);
  });

  it('lit le type de changement passé dans l’adresse de l’écran', () => {
    expect(parseChangeKind('early-departure')).toBe('early-departure');
    expect(parseChangeKind('absence')).toBeNull();
    expect(parseChangeKind(undefined)).toBeNull();
  });
});
