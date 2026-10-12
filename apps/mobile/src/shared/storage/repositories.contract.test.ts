import {
  Duration,
  HoursCounter,
  PlanGenerator,
  TimeOfDay,
  TimeSlot,
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
  type Plan,
  type Weekday,
} from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { BrowserCounterRepository } from './browser/browser-counter-repository';
import { BrowserPlanRepository } from './browser/browser-plan-repository';
import { BrowserPlanningPreferencesRepository } from './browser/browser-planning-preferences-repository';
import { BrowserWorkRulesSettingsRepository } from './browser/browser-work-rules-settings-repository';
import type { Repositories } from './repositories';
import { migrateDatabase } from './sqlite/migrate-database';
import { SqliteCounterRepository } from './sqlite/sqlite-counter-repository';
import { SqlitePlanRepository } from './sqlite/sqlite-plan-repository';
import { SqlitePlanningPreferencesRepository } from './sqlite/sqlite-planning-preferences-repository';
import { SqliteWorkRulesSettingsRepository } from './sqlite/sqlite-work-rules-settings-repository';
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
      });
    },
  ],
];

const generator = new PlanGenerator(laBrosseEtDupontRules());
const WEEK: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/** Résumé lisible d'un plan, pour comparer un plan enregistré et un plan relu. */
const describePlan = (plan: Plan | null): string[] =>
  plan === null
    ? []
    : [
        ...plan.days.map(
          (day) =>
            `${day.day} ${day.arrival.format()} ${day.lunchBreak.format()} ${day.departure.format()} ${day.worked.format()}`,
        ),
        `total ${plan.totalWorked.format()}`,
      ];

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

    it('retrouve un plan à l’identique : jours, horaires, pauses et temps travaillé', async () => {
      const { plans } = await create();
      const plan = generator.planForTotalHours(WEEK, Duration.ofHours(41));
      await plans.saveCurrent(plan);

      expect(describePlan(await plans.loadCurrent())).toEqual(describePlan(plan));
    });

    it('remplace entièrement le plan précédent', async () => {
      const { plans } = await create();
      await plans.saveCurrent(generator.planForTotalHours(WEEK, Duration.ofHours(41)));
      const shorter = generator.planForTotalHours(['monday', 'tuesday'], Duration.ofHours(15));
      await plans.saveCurrent(shorter);

      expect(describePlan(await plans.loadCurrent())).toEqual(describePlan(shorter));
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
});
