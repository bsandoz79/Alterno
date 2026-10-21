import {
  CalendarDate,
  Duration,
  HoursCounter,
  ReminderSettings,
  SchoolWeeks,
  SimulatePlan,
  TimeOfDay,
  TimeSlot,
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
  type DatedPlan,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { SilentNotifier } from '../notifications/silent-notifier';
import type { PickedDocument } from './annual-calendar-store';
import { BrowserAnnualCalendarStore } from './browser/browser-annual-calendar-store';
import { BrowserCounterRepository } from './browser/browser-counter-repository';
import { BrowserPlanRepository } from './browser/browser-plan-repository';
import { BrowserReminderSettingsRepository } from './browser/browser-reminder-settings-repository';
import { BrowserPlanningPreferencesRepository } from './browser/browser-planning-preferences-repository';
import { BrowserSchoolWeeksRepository } from './browser/browser-school-weeks-repository';
import { BrowserWorkRulesSettingsRepository } from './browser/browser-work-rules-settings-repository';
import type { Repositories } from './repositories';
import { migrateDatabase } from './sqlite/migrate-database';
import { SqliteAnnualCalendarStore } from './sqlite/sqlite-annual-calendar-store';
import { SqliteCounterRepository } from './sqlite/sqlite-counter-repository';
import { SqlitePlanRepository } from './sqlite/sqlite-plan-repository';
import { SqliteReminderSettingsRepository } from './sqlite/sqlite-reminder-settings-repository';
import { SqlitePlanningPreferencesRepository } from './sqlite/sqlite-planning-preferences-repository';
import { SqliteSchoolWeeksRepository } from './sqlite/sqlite-school-weeks-repository';
import { SqliteWorkRulesSettingsRepository } from './sqlite/sqlite-work-rules-settings-repository';
import { createMemoryDocumentFiles } from './testing/memory-document-files';
import { createMemoryStorage } from './testing/memory-storage';
import { createNodeSqlDatabase } from './testing/node-sql-database';

/**
 * Tests de contrat : les deux implémentations (SQLite sur téléphone, navigateur sur web)
 * doivent se comporter exactement de la même façon, puisque l'app les utilise sans savoir laquelle elle a.
 */
const implementations: readonly [string, () => Promise<Repositories>][] = [
  [
    'SQLite',
    async () => {
      const db = createNodeSqlDatabase();
      await migrateDatabase(db);
      return {
        plans: new SqlitePlanRepository(db),
        counter: new SqliteCounterRepository(db),
        workRules: new SqliteWorkRulesSettingsRepository(db),
        preferences: new SqlitePlanningPreferencesRepository(db),
        schoolWeeks: new SqliteSchoolWeeksRepository(db),
        annualCalendar: new SqliteAnnualCalendarStore(db, createMemoryDocumentFiles()),
        reminders: new SqliteReminderSettingsRepository(db),
        notifier: new SilentNotifier(),
      };
    },
  ],
  [
    'navigateur',
    () => {
      const storage = createMemoryStorage();
      return Promise.resolve({
        plans: new BrowserPlanRepository(storage),
        counter: new BrowserCounterRepository(storage),
        workRules: new BrowserWorkRulesSettingsRepository(storage),
        preferences: new BrowserPlanningPreferencesRepository(storage),
        schoolWeeks: new BrowserSchoolWeeksRepository(storage),
        annualCalendar: new BrowserAnnualCalendarStore(storage),
        reminders: new BrowserReminderSettingsRepository(storage),
        notifier: new SilentNotifier(),
      });
    },
  ],
];

const simulate = new SimulatePlan(laBrosseEtDupontRules());
const datesFrom = (isoDates: readonly string[]): CalendarDate[] =>
  isoDates.map((iso) => CalendarDate.fromIsoString(iso));
const WEEK = datesFrom(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);

/** Plan daté obtenu par simulation, comme celui que l'utilisateur valide. */
const planFor = (days: readonly CalendarDate[], hours: number): DatedPlan =>
  simulate.execute({
    days,
    objective: { kind: 'hours', target: Duration.ofHours(hours) },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });

/** Résumé lisible d'un plan, pour comparer un plan enregistré et un plan relu. */
const describePlan = (plan: DatedPlan | null): string[] =>
  plan === null
    ? []
    : [
        ...plan.days.map(
          ({ date, plan: day }) =>
            `${date.toIsoString()} ${day.day} ${day.arrival.format()} ${day.lunchBreak.format()} ${day.departure.format()} ${day.worked.format()}`,
        ),
        `total ${plan.totalWorked.format()}`,
        plan.recovery === undefined
          ? 'sans récup'
          : `récup ${plan.recovery.date.toIsoString()} ${plan.recovery.kind}`,
      ];

/** Plan qui prépare une récup le dernier jour de la période. */
const recoveryPlanFor = (days: readonly CalendarDate[]): DatedPlan => {
  const last = days.at(-1);
  if (last === undefined) {
    throw new Error('Période de test vide');
  }
  return simulate.execute({
    days,
    objective: { kind: 'recovery', date: last, recovery: 'half' },
    pace: 'steady',
    counter: HoursCounter.zero(),
  });
};

describe.each(implementations)('Stockage %s', (_, create) => {
  describe('compteur', () => {
    it('renvoie un compteur à zéro tant que rien n’est enregistré', async () => {
      const { counter } = await create();

      expect((await counter.load()).equals(HoursCounter.zero())).toBe(true);
    });

    it('retrouve un compteur négatif enregistré', async () => {
      const { counter } = await create();
      await counter.save(HoursCounter.of(Duration.ofHours(-1, -10)));

      expect((await counter.load()).format()).toBe('-1h10');
    });

    it('remplace la valeur précédente', async () => {
      const { counter } = await create();
      await counter.save(HoursCounter.of(Duration.ofHours(2)));
      await counter.save(HoursCounter.of(Duration.ofMinutes(5)));

      expect((await counter.load()).format()).toBe('+0h05');
    });
  });

  describe('plan en cours', () => {
    it('ne renvoie aucun plan tant que rien n’est enregistré', async () => {
      const { plans } = await create();

      expect(await plans.loadCurrent()).toBeNull();
    });

    it('retrouve un plan à l’identique : dates, jours, horaires, pauses et temps travaillé', async () => {
      const { plans } = await create();
      const plan = planFor(WEEK, 41);
      await plans.saveCurrent(plan);

      expect(describePlan(await plans.loadCurrent())).toEqual(describePlan(plan));
    });

    it('remplace entièrement le plan précédent', async () => {
      const { plans } = await create();
      await plans.saveCurrent(planFor(WEEK, 41));
      const shorter = planFor(WEEK.slice(0, 2), 15);
      await plans.saveCurrent(shorter);

      expect(describePlan(await plans.loadCurrent())).toEqual(describePlan(shorter));
    });

    it('retrouve la récup que le plan prépare (date et type)', async () => {
      const { plans } = await create();
      const plan = recoveryPlanFor(WEEK);
      await plans.saveCurrent(plan);

      expect(describePlan(await plans.loadCurrent())).toEqual(describePlan(plan));
    });

    it('oublie la récup quand le nouveau plan n’en prépare pas', async () => {
      const { plans } = await create();
      await plans.saveCurrent(recoveryPlanFor(WEEK));
      await plans.saveCurrent(planFor(WEEK, 35));

      expect((await plans.loadCurrent())?.recovery).toBeUndefined();
    });
  });
  describe('réglages des règles horaires', () => {
    it('ne renvoie aucun réglage tant que rien n’est enregistré (le preset s’appliquera)', async () => {
      const { workRules } = await create();

      expect(await workRules.load()).toBeNull();
    });

    it('retrouve les réglages à l’identique', async () => {
      const { workRules } = await create();
      const settings = laBrosseEtDupontSettings();
      const custom = {
        ...settings,
        friday: { ...settings.friday, latestDeparture: TimeOfDay.of(17, 0) },
        halfDayRecovery: Duration.ofHours(3, 45),
      };
      await workRules.save(custom);

      expect(await workRules.load()).toEqual(custom);
    });

    it('remplace les réglages précédents', async () => {
      const { workRules } = await create();
      const settings = laBrosseEtDupontSettings();
      await workRules.save({ ...settings, expectedDailyWork: Duration.ofHours(8) });
      await workRules.save(settings);

      expect(await workRules.load()).toEqual(settings);
    });
  });
  describe('préférences par jour', () => {
    it('renvoie des préférences vides tant que rien n’est enregistré (habitudes par défaut)', async () => {
      const { preferences } = await create();

      expect(await preferences.load()).toEqual({});
    });

    it('retrouve les préférences à l’identique', async () => {
      const { preferences } = await create();
      const saved = {
        defaults: {
          arrival: TimeOfDay.of(8, 15),
          lunchBreak: TimeSlot.between(TimeOfDay.of(12, 0), TimeOfDay.of(12, 45)),
        },
        days: {
          monday: { arrival: TimeOfDay.of(8, 30) },
          wednesday: { latestDeparture: TimeOfDay.of(17, 0), exactlyExpected: true },
          friday: { lunchBreak: TimeSlot.between(TimeOfDay.of(12, 0), TimeOfDay.of(12, 45)) },
        },
      };
      await preferences.save(saved);

      expect(await preferences.load()).toEqual(saved);
    });

    it('remplace les préférences précédentes', async () => {
      const { preferences } = await create();
      await preferences.save({ days: { monday: { arrival: TimeOfDay.of(8, 30) } } });
      await preferences.save({ days: { tuesday: { exactlyExpected: true } } });

      expect(await preferences.load()).toEqual({ days: { tuesday: { exactlyExpected: true } } });
    });
  });
  describe('semaines d’école', () => {
    const isoMondays = (weeks: SchoolWeeks): string[] =>
      weeks.mondays().map((monday) => monday.toIsoString());

    it('ne renvoie aucune semaine tant que rien n’est enregistré', async () => {
      const { schoolWeeks } = await create();

      expect(isoMondays(await schoolWeeks.load())).toEqual([]);
    });

    it('retrouve les semaines enregistrées', async () => {
      const { schoolWeeks } = await create();
      await schoolWeeks.save(SchoolWeeks.of(datesFrom(['2026-11-02', '2026-10-19'])));

      expect(isoMondays(await schoolWeeks.load())).toEqual(['2026-10-19', '2026-11-02']);
    });

    it('remplace les semaines précédentes (une semaine démarquée disparaît)', async () => {
      const { schoolWeeks } = await create();
      await schoolWeeks.save(SchoolWeeks.of(datesFrom(['2026-10-19', '2026-11-02'])));
      await schoolWeeks.save(SchoolWeeks.of(datesFrom(['2026-11-02'])));

      expect(isoMondays(await schoolWeeks.load())).toEqual(['2026-11-02']);
    });
  });
  describe('calendrier annuel joint', () => {
    const today = CalendarDate.fromIsoString('2026-10-12');
    const pdf: PickedDocument = {
      uri: 'file:///cache/calendrier-epsi.pdf',
      name: 'Calendrier EPSI 2026-2027.pdf',
      mimeType: 'application/pdf',
      size: 10_128,
      dataUrl: 'data:application/pdf;base64,JVBERi0=',
    };

    it('ne renvoie aucun calendrier tant que rien n’est joint', async () => {
      const { annualCalendar } = await create();

      expect(await annualCalendar.load()).toBeNull();
    });

    it('retrouve le calendrier joint : nom, type, taille, date d’ajout et adresse lisible', async () => {
      const { annualCalendar } = await create();
      const attached = await annualCalendar.attach(pdf, today);

      expect(await annualCalendar.load()).toEqual(attached);
      expect(attached).toMatchObject({
        name: 'Calendrier EPSI 2026-2027.pdf',
        mimeType: 'application/pdf',
        size: 10_128,
        addedOn: '2026-10-12',
      });
      expect(attached.uri).not.toBe('');
    });

    it('remplace le calendrier précédent', async () => {
      const { annualCalendar } = await create();
      await annualCalendar.attach(pdf, today);
      await annualCalendar.attach(
        { ...pdf, name: 'photo.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,iVBO' },
        today,
      );

      expect((await annualCalendar.load())?.name).toBe('photo.png');
    });

    it('supprime le calendrier joint', async () => {
      const { annualCalendar } = await create();
      await annualCalendar.attach(pdf, today);
      await annualCalendar.remove();

      expect(await annualCalendar.load()).toBeNull();
    });
  });

  describe('réglage des rappels', () => {
    it('rappelle 15 min avant le départ tant que rien n’est enregistré', async () => {
      const { reminders } = await create();

      expect((await reminders.load()).departureLead?.format()).toBe('0h15');
    });

    it('retrouve le délai enregistré', async () => {
      const { reminders } = await create();
      await reminders.save(ReminderSettings.departureLead(Duration.ofMinutes(30)));

      expect((await reminders.load()).departureLead?.format()).toBe('0h30');
    });

    it('retrouve la question à l’heure de départ, activée ou non', async () => {
      const { reminders } = await create();
      await reminders.save(ReminderSettings.create({ departureLead: null, atDeparture: true }));

      expect((await reminders.load()).atDeparture).toBe(true);
      expect((await reminders.load()).departureLead).toBeNull();

      await reminders.save(
        ReminderSettings.create({ departureLead: Duration.ofMinutes(5), atDeparture: false }),
      );

      expect((await reminders.load()).atDeparture).toBe(false);
    });

    it('retrouve la question de fin de semaine, activée ou non', async () => {
      const { reminders } = await create();

      expect((await reminders.load()).weekCheck).toBe(true);

      await reminders.save(
        ReminderSettings.create({ departureLead: null, atDeparture: true, weekCheck: false }),
      );

      expect((await reminders.load()).weekCheck).toBe(false);
      expect((await reminders.load()).atDeparture).toBe(true);
    });

    it('retrouve un rappel désactivé', async () => {
      const { reminders } = await create();
      await reminders.save(ReminderSettings.departureLead(Duration.ofMinutes(5)));
      await reminders.save(ReminderSettings.disabled());

      expect((await reminders.load()).departureLead).toBeNull();
    });
  });
});
