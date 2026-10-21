import { Duration, laBrosseEtDupontSettings } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import {
  fromWorkRulesSettingsRecord,
  toWorkRulesSettingsRecord,
} from './work-rules-settings-record';

describe('Réglages enregistrés', () => {
  it('conserve le découvert réglé, y compris aucun découvert', () => {
    const settings = { ...laBrosseEtDupontSettings(), maximumDeficit: Duration.zero() };

    expect(fromWorkRulesSettingsRecord(toWorkRulesSettingsRecord(settings))).toEqual(settings);
  });

  it('conserve le plafond du compteur, et reprend celui du preset (7h) pour des réglages plus anciens', () => {
    const settings = { ...laBrosseEtDupontSettings(), maximumCredit: Duration.ofHours(5) };
    const { maximumCredit, ...older } = toWorkRulesSettingsRecord(settings);

    expect(fromWorkRulesSettingsRecord({ ...older, maximumCredit }).maximumCredit?.format()).toBe(
      '5h',
    );
    expect(fromWorkRulesSettingsRecord(older).maximumCredit?.format()).toBe('7h');
    expect(fromWorkRulesSettingsRecord({ ...older, maximumCredit: null }).maximumCredit).toBeNull();
  });

  it('reprend le découvert du preset (4h) pour des réglages enregistrés avant son ajout', () => {
    const { maximumDeficit, ...older } = toWorkRulesSettingsRecord({
      ...laBrosseEtDupontSettings(),
      maximumDeficit: Duration.ofHours(1),
    });
    expect(maximumDeficit).toBe(60);

    // Données telles qu'enregistrées avant ALT-43 : sans le champ du découvert.
    const settings = fromWorkRulesSettingsRecord(older);

    expect(settings.maximumDeficit.format()).toBe('4h');
  });
});
