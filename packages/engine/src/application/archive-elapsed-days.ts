import { DayArchiver } from '../domain/history/day-archiver';
import type { ArchivedDay } from '../domain/history/archived-day';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { DayArchiveRepository } from '../domain/ports/day-archive-repository';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { SchoolWeeksRepository } from '../domain/ports/school-weeks-repository';
import type { WorkRulesSettingsRepository } from '../domain/ports/work-rules-settings-repository';
import { laBrosseEtDupontSettings } from '../domain/rules/presets/la-brosse-et-dupont';
import { buildWorkRules } from '../domain/rules/work-rules-settings';

/** Dépôts dont l'archivage a besoin : règles (temps attendu, récups) et semaines d'école. */
export interface ArchiveSources {
  readonly workRules: WorkRulesSettingsRepository;
  readonly schoolWeeks: SchoolWeeksRepository;
}

/**
 * Cas d'usage « Archiver les journées passées » : les jours d'avant aujourd'hui des plans connus
 * passent dans l'archive de l'historique (`DayArchiver`), où un nouveau plan ne les efface plus.
 *
 * Plusieurs sources de plan : le plan enregistré et le plan affiché (semaine standard comprise).
 * Pour une même date, la dernière source l'emporte.
 */
export class ArchiveElapsedDays {
  /**
   * @param plans - Sources de plan, de la moins à la plus prioritaire
   * @param archive - Archive des journées
   * @param sources - Règles et semaines d'école
   * @param clock - Horloge (date du jour)
   */
  constructor(
    private readonly plans: readonly PlanRepository[],
    private readonly archive: DayArchiveRepository,
    private readonly sources: ArchiveSources,
    private readonly clock: Clock,
  ) {}

  /**
   * Archive (ou met à jour) les journées passées.
   */
  async execute(): Promise<void> {
    const [settings, schoolWeeks, ...plans] = await Promise.all([
      this.sources.workRules.load(),
      this.sources.schoolWeeks.load(),
      ...this.plans.map((repository) => repository.loadCurrent()),
    ]);
    const archiver = new DayArchiver(buildWorkRules(settings ?? laBrosseEtDupontSettings()));
    const today = this.clock.today();
    const byDate = new Map<string, ArchivedDay>();
    plans
      .filter((plan): plan is DatedPlan => plan !== null)
      .forEach((plan) => {
        archiver.elapsedDays(plan, today, schoolWeeks).forEach((day) => {
          byDate.set(day.date.toIsoString(), day);
        });
      });
    if (byDate.size > 0) {
      await this.archive.save([...byDate.values()]);
    }
  }
}
