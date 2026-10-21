import {
  CalendarDate,
  Duration,
  HoursCounter,
  ReminderSettings,
  SchoolWeeks,
  SimulatePlan,
  TimeOfDay,
  laBrosseEtDupontRules,
  type Notifier,
  type ScheduledReminder,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { BrowserAnnualCalendarStore } from '@/shared/storage/browser/browser-annual-calendar-store';
import { BrowserCounterRepository } from '@/shared/storage/browser/browser-counter-repository';
import { BrowserPersonalDataEraser } from '@/shared/storage/browser/browser-personal-data-eraser';
import { BrowserPlanRepository } from '@/shared/storage/browser/browser-plan-repository';
import { BrowserPlanningPreferencesRepository } from '@/shared/storage/browser/browser-planning-preferences-repository';
import { BrowserReminderSettingsRepository } from '@/shared/storage/browser/browser-reminder-settings-repository';
import { BrowserSchoolWeeksRepository } from '@/shared/storage/browser/browser-school-weeks-repository';
import { BrowserWorkRulesSettingsRepository } from '@/shared/storage/browser/browser-work-rules-settings-repository';
import { createMemoryStorage } from '@/shared/storage/testing/memory-storage';

import { eraseMyData } from './erase-my-data';
import { exportMyData } from './my-data-export';

const date = (iso: string): CalendarDate => CalendarDate.fromIsoString(iso);

/** Dépôts du navigateur en mémoire, et un notificateur qui garde les rappels programmés. */
const createSources = () => {
  const storage = createMemoryStorage();
  const notifier: Notifier & { scheduled: readonly ScheduledReminder[] | null } = {
    scheduled: null,
    replaceReminders(reminders) {
      this.scheduled = reminders;
      return Promise.resolve('scheduled');
    },
  };
  return {
    plans: new BrowserPlanRepository(storage),
    counter: new BrowserCounterRepository(storage),
    workRules: new BrowserWorkRulesSettingsRepository(storage),
    preferences: new BrowserPlanningPreferencesRepository(storage),
    schoolWeeks: new BrowserSchoolWeeksRepository(storage),
    annualCalendar: new BrowserAnnualCalendarStore(storage),
    reminders: new BrowserReminderSettingsRepository(storage),
    eraser: new BrowserPersonalDataEraser(storage),
    notifier,
  };
};

const recoveryPlan = new SimulatePlan(laBrosseEtDupontRules()).execute({
  days: ['2026-10-19', '2026-10-20'].map(date),
  objective: { kind: 'recovery', date: date('2026-10-23'), recovery: 'half', part: 'morning' },
  pace: 'steady',
  counter: HoursCounter.zero(),
});

describe('Mes données — export et effacement (RGPD)', () => {
  it('exporte tout ce qui est enregistré, au format du stockage (minutes, dates AAAA-MM-JJ)', async () => {
    const sources = createSources();
    await sources.plans.saveCurrent(recoveryPlan);
    await sources.counter.save(HoursCounter.of(Duration.ofHours(2, 15)));
    await sources.preferences.save({ days: { monday: { arrival: TimeOfDay.of(8, 30) } } });
    await sources.schoolWeeks.save(SchoolWeeks.of([date('2026-11-02')]));
    await sources.reminders.save(ReminderSettings.disabled());
    await sources.annualCalendar.attach(
      {
        uri: 'file:///cache/calendrier.pdf',
        name: 'calendrier.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        dataUrl: 'data:application/pdf;base64,JVBERi0=',
      },
      date('2026-10-01'),
    );

    const exported = await exportMyData(sources, date('2026-10-21'));

    expect(exported).toMatchObject({
      app: 'Alterno',
      exportedOn: '2026-10-21',
      counterMinutes: 135,
      workRules: null,
      preferences: { days: { monday: { arrival: 510 } } },
      schoolWeeks: ['2026-11-02'],
      // Le fichier lui-même n'est pas dans l'export : seulement ses informations.
      annualCalendar: {
        name: 'calendrier.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        addedOn: '2026-10-01',
      },
      reminders: { departureLeadMinutes: null, atDeparture: false },
    });
    expect(exported.plan?.days.map((day) => day.date)).toEqual(['2026-10-19', '2026-10-20']);
    expect(exported.plan?.recovery).toMatchObject({
      date: '2026-10-23',
      kind: 'half',
      part: 'morning',
    });
  });

  it('n’exporte pas la semaine standard, qui n’est pas enregistrée', async () => {
    const sources = createSources();
    const defaultWeek = { ...recoveryPlan, isDefault: true };
    const exported = await exportMyData(
      {
        ...sources,
        plans: {
          loadCurrent: () => Promise.resolve(defaultWeek),
          saveCurrent: () => Promise.resolve(),
        },
      },
      date('2026-10-21'),
    );

    expect(exported.plan).toBeNull();
  });

  it('efface tout, y compris le calendrier joint, et annule les notifications programmées', async () => {
    const sources = createSources();
    await sources.plans.saveCurrent(recoveryPlan);
    await sources.annualCalendar.attach(
      {
        uri: 'file:///cache/calendrier.pdf',
        name: 'calendrier.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        dataUrl: 'data:application/pdf;base64,JVBERi0=',
      },
      date('2026-10-01'),
    );

    await eraseMyData(sources);

    expect(await sources.plans.loadCurrent()).toBeNull();
    expect(await sources.annualCalendar.load()).toBeNull();
    expect(sources.notifier.scheduled).toEqual([]);
  });
});
