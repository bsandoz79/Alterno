import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';

/** Délai maximal du rappel : au-delà, il ne rappelle plus vraiment l'heure de départ. */
const MAXIMUM_LEAD = Duration.ofHours(2);

/**
 * Réglage des rappels : combien de temps avant l'heure de départ prévue prévenir l'utilisateur,
 * ou pas de rappel du tout. Value object immuable, toujours valide.
 */
export class ReminderSettings {
  private constructor(
    /** Délai avant le départ, ou `null` si le rappel est désactivé. */
    readonly departureLead: Duration | null,
  ) {}

  /** @returns Le réglage par défaut : rappel 15 min avant le départ */
  static defaults(): ReminderSettings {
    return new ReminderSettings(Duration.ofMinutes(15));
  }

  /** @returns Aucun rappel */
  static disabled(): ReminderSettings {
    return new ReminderSettings(null);
  }

  /**
   * @param lead - Délai avant l'heure de départ
   * @returns Le réglage avec ce délai
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h
   */
  static departureLead(lead: Duration): ReminderSettings {
    if (lead.isNegative() || lead.isZero() || lead.isGreaterThan(MAXIMUM_LEAD)) {
      throw new InvalidValueError(
        `Le rappel doit être programmé entre 1 min et ${MAXIMUM_LEAD.format()} avant le départ.`,
      );
    }
    return new ReminderSettings(lead);
  }
}
