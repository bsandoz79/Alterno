import { describe, expect, it } from 'vitest';

import { CounterCalculator } from '../counter/counter-calculator';
import { HoursCounter } from '../counter/hours-counter';
import type { RecoveryKind } from '../counter/recovery-kind';
import {
  laBrosseEtDupontRules,
  laBrosseEtDupontSettings,
} from '../rules/presets/la-brosse-et-dupont';
import type { Weekday } from '../rules/weekday';
import { buildWorkRules } from '../rules/work-rules-settings';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { ImpossiblePlanError } from './impossible-plan-error';
import { LatePace } from './pace/late-pace';
import type { Plan } from './plan';
import { RecoveryPlanner } from './recovery-planner';

const rules = laBrosseEtDupontRules();
const planner = new RecoveryPlanner(rules);
const counterCalculator = new CounterCalculator(rules);
/** Mêmes règles sans découvert : la récup doit être entièrement rattrapée avant. */
const strictPlanner = new RecoveryPlanner(
  buildWorkRules({ ...laBrosseEtDupontSettings(), maximumDeficit: Duration.zero() }),
);

const MONDAY_TO_THURSDAY: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday'];
const h = (hours: number, minutes = 0): Duration => Duration.ofHours(hours, minutes);
const counterOf = (hours: number, minutes = 0): HoursCounter => HoursCounter.of(h(hours, minutes));

/** Compteur restant après avoir suivi le plan puis posé la récupération. */
const counterAfterRecovery = (start: HoursCounter, plan: Plan, kind: RecoveryKind): HoursCounter =>
  counterCalculator.takeRecovery(
    counterCalculator.applyWorkedDays(
      start,
      plan.days.map((day) => day.worked),
    ),
    kind,
  );

describe('RecoveryPlanner — récup à une date choisie', () => {
  describe('journée de récup', () => {
    it('compteur à 0 : 4 journées de 8h45 pour poser la récup le vendredi', () => {
      const plan = planner.planForRecovery(MONDAY_TO_THURSDAY, HoursCounter.zero(), 'full');

      expect(plan.days.map((day) => day.worked.format())).toEqual(['8h45', '8h45', '8h45', '8h45']);
      expect(
        counterAfterRecovery(HoursCounter.zero(), plan, 'full').equals(HoursCounter.zero()),
      ).toBe(true);
    });

    it('tient compte du compteur existant : avec +2h15, il ne reste que 4h45 à faire', () => {
      const start = counterOf(2, 15);
      const plan = planner.planForRecovery(MONDAY_TO_THURSDAY, start, 'full');

      expect(plan.totalWorked.equals(h(32, 45))).toBe(true);
      expect(counterAfterRecovery(start, plan, 'full').equals(HoursCounter.zero())).toBe(true);
    });

    it('rattrape un compteur négatif : avec -1h, il faut 8h de plus', () => {
      const start = counterOf(-1);
      const plan = planner.planForRecovery(MONDAY_TO_THURSDAY, start, 'full');

      expect(plan.totalWorked.equals(h(36))).toBe(true);
      expect(counterAfterRecovery(start, plan, 'full').equals(HoursCounter.zero())).toBe(true);
    });

    it('compteur déjà suffisant : journées de 7h, le surplus est conservé', () => {
      const start = counterOf(9);
      const plan = planner.planForRecovery(MONDAY_TO_THURSDAY, start, 'full');

      expect(plan.days.every((day) => day.worked.equals(h(7)))).toBe(true);
      expect(counterAfterRecovery(start, plan, 'full').equals(counterOf(2))).toBe(true);
    });

    it('sur deux semaines : récup le 2e vendredi, 7h réparties sur 9 jours', () => {
      const days: readonly Weekday[] = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        ...MONDAY_TO_THURSDAY,
      ];
      const plan = planner.planForRecovery(days, HoursCounter.zero(), 'full');

      expect(plan.days).toHaveLength(9);
      expect(plan.totalWorked.equals(h(70))).toBe(true);
      expect(
        counterAfterRecovery(HoursCounter.zero(), plan, 'full').equals(HoursCounter.zero()),
      ).toBe(true);
    });
  });

  describe('choix du rythme', () => {
    it('au plus juste : les 7h à rattraper sont repoussées sur les derniers jours', () => {
      const plan = planner.planForRecovery(
        MONDAY_TO_THURSDAY,
        HoursCounter.zero(),
        'full',
        new LatePace(),
      );

      expect(plan.days.map((day) => day.worked.format())).toEqual(['7h', '8h', '10h', '10h']);
      expect(
        counterAfterRecovery(HoursCounter.zero(), plan, 'full').equals(HoursCounter.zero()),
      ).toBe(true);
    });
  });

  describe('demi-journée de récup', () => {
    it('compteur à 0 : 3h30 à faire sur les 4 jours précédents', () => {
      const plan = planner.planForRecovery(MONDAY_TO_THURSDAY, HoursCounter.zero(), 'half');

      expect(plan.totalWorked.equals(h(31, 30))).toBe(true);
      expect(
        counterAfterRecovery(HoursCounter.zero(), plan, 'half').equals(HoursCounter.zero()),
      ).toBe(true);
    });
  });

  describe('découvert (4h autorisées)', () => {
    it('évite le découvert quand il y a le temps : compteur à 0, on finit à 0 après la récup', () => {
      const outlook = planner.recoveryOutlook(MONDAY_TO_THURSDAY, HoursCounter.zero(), 'full');

      expect(outlook).toEqual({ reachable: true, catchUp: h(7), deficitAfter: Duration.zero() });
    });

    it('récup trop proche pour tout rattraper : journées maximales, on finit à -1h', () => {
      // Récup le mercredi avec 0h : lundi et mardi à 10h donnent +6h, il manque 1h, pris sur le découvert.
      const days: readonly Weekday[] = ['monday', 'tuesday'];
      const plan = planner.planForRecovery(days, HoursCounter.zero(), 'full');

      expect(plan.days.map((day) => day.worked.format())).toEqual(['10h', '10h']);
      expect(counterAfterRecovery(HoursCounter.zero(), plan, 'full').equals(counterOf(-1))).toBe(
        true,
      );
      expect(planner.recoveryOutlook(days, HoursCounter.zero(), 'full')).toEqual({
        reachable: true,
        catchUp: h(6),
        deficitAfter: h(1),
      });
    });

    it('cas limite : le découvert est utilisé jusqu’à -4h pile', () => {
      // Récup le mardi avec 0h : lundi à 10h donne +3h, la récup (7h) amène à -4h.
      const outlook = planner.recoveryOutlook(['monday'], HoursCounter.zero(), 'full');

      expect(outlook).toEqual({ reachable: true, catchUp: h(3), deficitAfter: h(4) });
    });

    it('demi-journée possible dès -0h30 : 3h rattrapées le lundi, on finit à -1h', () => {
      const outlook = planner.recoveryOutlook(['monday'], counterOf(0, -30), 'half');

      expect(outlook).toEqual({ reachable: true, catchUp: h(3), deficitAfter: h(1) });
    });
  });

  describe('récup impossible', () => {
    it('indique combien il manque même en utilisant tout le découvert', () => {
      // Récup le mardi avec -2h : il faudrait 9h, dont 4h de découvert ; lundi à 10h n'en donne que 3h.
      expect(planner.recoveryOutlook(['monday'], counterOf(-2), 'full')).toEqual({
        reachable: false,
        missing: h(2),
      });
    });

    it('refuse une récup trop proche en indiquant le manque exact', () => {
      const tooSoon = (): Plan => planner.planForRecovery(['monday'], counterOf(-2), 'full');

      expect(tooSoon).toThrow(ImpossiblePlanError);
      expect(tooSoon).toThrow(/journée de récup.*il manque 2h/);
    });

    it('sans découvert, exige de tout rattraper avant', () => {
      // Récup le mardi avec -2h : il faudrait 16h le lundi, la journée maximale est de 10h.
      const tooSoon = (): Plan => strictPlanner.planForRecovery(['monday'], counterOf(-2), 'full');

      expect(tooSoon).toThrow(/journée de récup.*il manque 6h/);
    });

    it('refuse une période vide', () => {
      expect(() => planner.planForRecovery([], HoursCounter.zero(), 'full')).toThrow(
        InvalidValueError,
      );
    });
  });
});
