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
