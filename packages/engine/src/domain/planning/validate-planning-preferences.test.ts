import { describe, expect, it } from 'vitest';

import { laBrosseEtDupontRules } from '../rules/presets/la-brosse-et-dupont';
import { InvalidValueError } from '../shared/domain-error';
import { TimeOfDay } from '../time/time-of-day';
import { validatePlanningPreferences } from './validate-planning-preferences';

const rules = laBrosseEtDupontRules();

describe('validatePlanningPreferences — préférences compatibles avec les règles', () => {
  it('accepte des préférences cohérentes', () => {
    expect(() => {
      validatePlanningPreferences(rules, {
        days: { monday: { arrival: TimeOfDay.of(8, 30) }, wednesday: { exactlyExpected: true } },
      });
    }).not.toThrow();
  });

  it('accepte l’absence de préférences (habitudes par défaut)', () => {
    expect(() => {
      validatePlanningPreferences(rules, {});
    }).not.toThrow();
  });

  it('refuse une préférence hors des plages, avec le message du moteur', () => {
    expect(() => {
      validatePlanningPreferences(rules, { days: { monday: { arrival: TimeOfDay.of(9, 30) } } });
    }).toThrow(InvalidValueError);
  });
});
