import type { ReminderSettings, ReminderSettingsRepository } from '@alterno/engine';

/**
 * Décorateur du dépôt du réglage des rappels : un nouveau délai (ou la désactivation)
 * reprogramme aussitôt les rappels de départ.
 */
export class ReschedulingReminderSettingsRepository implements ReminderSettingsRepository {
  /**
   * @param inner - Dépôt réel du réglage
   * @param reschedule - Reprogrammation des rappels, appelée après chaque enregistrement
   */
  constructor(
    private readonly inner: ReminderSettingsRepository,
    private readonly reschedule: () => Promise<unknown>,
  ) {}

  /** @inheritdoc */
  load(): Promise<ReminderSettings> {
    return this.inner.load();
  }

  /** @inheritdoc */
  async save(settings: ReminderSettings): Promise<void> {
    await this.inner.save(settings);
    await this.reschedule();
  }
}
