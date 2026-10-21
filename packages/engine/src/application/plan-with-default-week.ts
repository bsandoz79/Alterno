import { DefaultWeekPlanner } from '../domain/planning/default-week-planner';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { PlanningPreferencesRepository } from '../domain/ports/planning-preferences-repository';
import type { SchoolWeeksRepository } from '../domain/ports/school-weeks-repository';
import type { WorkRulesSettingsRepository } from '../domain/ports/work-rules-settings-repository';
import { laBrosseEtDupontSettings } from '../domain/rules/presets/la-brosse-et-dupont';
import { buildWorkRules } from '../domain/rules/work-rules-settings';

/** Dépôts dont la semaine standard a besoin : règles, préférences et semaines d'école. */
export interface DefaultWeekSources {
  readonly workRules: WorkRulesSettingsRepository;
  readonly preferences: PlanningPreferencesRepository;
  readonly schoolWeeks: SchoolWeeksRepository;
}

/**
 * Dépôt du plan qui, faute de plan validé pour la semaine, renvoie la semaine standard
 * (`DefaultWeekPlanner`). Décorateur : tous les écrans et cas d'usage qui lisent le plan en cours
 * (accueil, semaine, rappels, solde à venir) en profitent sans rien changer.
 * Lire n'enregistre rien ; enregistrer (plan validé, écart déclaré) en fait un plan comme un autre.
 */
export class PlanWithDefaultWeek implements PlanRepository {
  /**
   * @param inner - Dépôt réel du plan validé
   * @param sources - Règles, préférences et semaines d'école de l'utilisateur
   * @param clock - Horloge (date du jour)
   */
  constructor(
    private readonly inner: PlanRepository,
    private readonly sources: DefaultWeekSources,
    private readonly clock: Clock,
  ) {}

  /** @inheritdoc */
  async loadCurrent(): Promise<DatedPlan | null> {
    const [stored, settings, preferences, schoolWeeks] = await Promise.all([
      this.inner.loadCurrent(),
      this.sources.workRules.load(),
      this.sources.preferences.load(),
      this.sources.schoolWeeks.load(),
    ]);
    const rules = buildWorkRules(settings ?? laBrosseEtDupontSettings());
    return new DefaultWeekPlanner(rules, preferences).currentPlan(
      stored,
      this.clock.today(),
      schoolWeeks,
    );
  }

  /**
   * Enregistre le plan ; une semaine standard enregistrée (écart déclaré) devient un plan validé.
   *
   * @param plan - Plan à enregistrer
   */
  async saveCurrent(plan: DatedPlan): Promise<void> {
    // Une fois enregistrée, la semaine standard n'est plus « par défaut » : c'est le plan suivi.
    await this.inner.saveCurrent({ ...plan, isDefault: false });
  }
}
