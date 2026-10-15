import type { DepartureReminder, Notifier, ReminderDelivery } from '@alterno/engine';

/**
 * Notificateur chargé seulement au premier rappel à programmer.
 * Le module de notifications n'est ainsi jamais évalué là où il ne doit pas l'être (Expo Go).
 */
export class DeferredNotifier implements Notifier {
  private loaded: Promise<Notifier> | null = null;

  /**
   * @param load - Chargement du vrai notificateur (import dynamique), appelé une seule fois
   */
  constructor(private readonly load: () => Promise<Notifier>) {}

  /** @inheritdoc */
  async replaceDepartureReminders(
    reminders: readonly DepartureReminder[],
  ): Promise<ReminderDelivery> {
    this.loaded ??= this.load();
    return (await this.loaded).replaceDepartureReminders(reminders);
  }
}
