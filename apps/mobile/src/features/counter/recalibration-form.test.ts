import { Duration, HoursCounter } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { previewRecalibration } from './recalibration-form';

const current = HoursCounter.of(Duration.ofHours(1, 55));

describe('previewRecalibration — aperçu pendant la saisie du solde Smart RH', () => {
  it('n’affiche rien tant que le champ est vide', () => {
    expect(previewRecalibration(current, '  ')).toBeNull();
  });

  it('montre la correction pour un solde valide', () => {
    const preview = previewRecalibration(current, '+2h15');

    expect(preview?.ok && preview.recalibration.adjustment.format({ signed: true })).toBe('+0h20');
  });

  it('accepte un solde négatif', () => {
    const preview = previewRecalibration(current, '-0h30');

    expect(preview?.ok && preview.recalibration.counter.format()).toBe('-0h30');
  });

  it('explique le format attendu pour une saisie illisible', () => {
    expect(previewRecalibration(current, '2,5')).toEqual({
      ok: false,
      error: 'Solde invalide : « 2,5 » (attendu par exemple +2h15, -0h30 ou 2h).',
    });
  });
});
