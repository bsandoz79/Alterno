import { describe, expect, it } from 'vitest';

import { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan, RecoveryApprovalStatus } from '../planning/dated-plan';
import { Duration } from '../time/duration';
import { TimeOfDay } from '../time/time-of-day';
import { RecoveryApprovalPlanner } from './recovery-approval-planner';
import { ReminderSettings } from './reminder-settings';

const planner = new RecoveryApprovalPlanner();
const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);
const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

/** Plan dont la récup du vendredi 30 a été demandée le lundi 19 à 9h00. */
const planWith = (status: RecoveryApprovalStatus | null): DatedPlan => ({
  days: [],
  totalWorked: Duration.zero(),
  recovery: {
    date: date('2026-10-30'),
    kind: 'full',
    ...(status === null
      ? {}
      : { approval: { status, requestedOn: date('2026-10-19'), requestedAt: at('09:00') } }),
  },
});

const describeQuestions = (
  plan: DatedPlan,
  today: string,
  now: string,
  settings = ReminderSettings.defaults(),
) =>
  planner
    .questionsFor(plan, { today: date(today), now: at(now) }, settings)
    .map((question) => `${question.date.toIsoString()} ${question.at.format()}`);

describe('RecoveryApprovalPlanner — « Ta récup a-t-elle été acceptée ? »', () => {
  it('demande 48h après la demande, puis relance chaque jour jusqu’à la veille de la récup', () => {
    expect(describeQuestions(planWith('pending'), '2026-10-19', '09:00')).toEqual([
      '2026-10-21 9h00',
      '2026-10-22 9h00',
      '2026-10-23 9h00',
      '2026-10-24 9h00',
      '2026-10-25 9h00',
      '2026-10-26 9h00',
      '2026-10-27 9h00',
      '2026-10-28 9h00',
      '2026-10-29 9h00',
    ]);
  });

  it('sans réponse, seules les relances encore à venir sont gardées', () => {
    expect(describeQuestions(planWith('pending'), '2026-10-28', '09:00')).toEqual([
      '2026-10-29 9h00',
    ]);
  });

  it('applique les délais réglés (première question après 1 jour, relance tous les 3 jours)', () => {
    const settings = ReminderSettings.create({
      departureLead: null,
      atDeparture: false,
      approvalFirstDelayDays: 1,
      approvalRepeatDays: 3,
    });

    expect(describeQuestions(planWith('pending'), '2026-10-19', '09:00', settings)).toEqual([
      '2026-10-20 9h00',
      '2026-10-23 9h00',
      '2026-10-26 9h00',
      '2026-10-29 9h00',
    ]);
  });

  it.each([
    ['acceptée', 'approved'],
    ['refusée', 'refused'],
  ] as const)('ne demande plus rien une fois la récup %s', (_case, status) => {
    expect(describeQuestions(planWith(status), '2026-10-19', '09:00')).toEqual([]);
  });

  it('cas limite : récup passée, plus de question', () => {
    expect(describeQuestions(planWith('pending'), '2026-10-30', '08:00')).toEqual([]);
  });

  it('ne demande rien sans suivi (plan validé avant ALT-55) ni sans récup', () => {
    expect(describeQuestions(planWith(null), '2026-10-19', '09:00')).toEqual([]);
    expect(
      describeQuestions({ days: [], totalWorked: Duration.zero() }, '2026-10-19', '09:00'),
    ).toEqual([]);
  });

  it('ne demande rien quand le suivi est désactivé', () => {
    const settings = ReminderSettings.create({
      departureLead: null,
      atDeparture: false,
      approvalCheck: false,
    });

    expect(describeQuestions(planWith('pending'), '2026-10-19', '09:00', settings)).toEqual([]);
  });
});
