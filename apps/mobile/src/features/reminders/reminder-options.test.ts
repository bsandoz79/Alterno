import { Duration, ReminderSettings } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import {
  REMINDER_OPTIONS,
  reminderDraftOf,
  reminderSettingsFor,
  sameReminderDraft,
} from './reminder-options';

describe('Réglage des notifications de départ', () => {
  it('propose : aucun, 5, 15 ou 30 min avant le départ', () => {
    expect(REMINDER_OPTIONS.map((option) => option.label)).toEqual([
      'Aucun',
      '5 min',
      '15 min',
      '30 min',
    ]);
  });

  it('affiche le réglage par défaut : 15 min avant, et question à l’heure de départ', () => {
    expect(reminderDraftOf(ReminderSettings.defaults())).toEqual({
      lead: 15,
      atDeparture: true,
      weekCheck: true,
      approvalCheck: true,
      approvalFirstDelayDays: 2,
      approvalRepeatDays: 1,
    });
  });

  it('affiche un réglage désactivé : aucun rappel, pas de question', () => {
    expect(reminderDraftOf(ReminderSettings.disabled())).toEqual({
      lead: 0,
      atDeparture: false,
      weekCheck: false,
      approvalCheck: false,
      approvalFirstDelayDays: 2,
      approvalRepeatDays: 1,
    });
  });

  it('transforme la saisie en réglage', () => {
    const settings = reminderSettingsFor({
      lead: 30,
      atDeparture: false,
      weekCheck: false,
      approvalCheck: true,
      approvalFirstDelayDays: 3,
      approvalRepeatDays: 2,
    });

    expect(settings.departureLead?.equals(Duration.ofMinutes(30))).toBe(true);
    expect(settings.atDeparture).toBe(false);
    expect(settings.weekCheck).toBe(false);
    expect([settings.approvalFirstDelayDays, settings.approvalRepeatDays]).toEqual([3, 2]);
    expect(
      reminderSettingsFor({
        lead: 0,
        atDeparture: true,
        weekCheck: true,
        approvalCheck: true,
        approvalFirstDelayDays: 2,
        approvalRepeatDays: 1,
      }).departureLead,
    ).toBeNull();
  });

  it('compare deux saisies pour savoir s’il y a quelque chose à valider', () => {
    const draft = {
      lead: 5,
      atDeparture: true,
      weekCheck: true,
      approvalCheck: true,
      approvalFirstDelayDays: 2,
      approvalRepeatDays: 1,
    };

    expect(sameReminderDraft(draft, { ...draft })).toBe(true);
    expect(sameReminderDraft(draft, { ...draft, atDeparture: false })).toBe(false);
    expect(sameReminderDraft(draft, { ...draft, weekCheck: false })).toBe(false);
    expect(sameReminderDraft(draft, { ...draft, approvalRepeatDays: 2 })).toBe(false);
  });
});
