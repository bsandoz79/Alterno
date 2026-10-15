import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';

/** Délai maximal du rappel : au-delà, il ne rappelle plus vraiment l'heure de départ. */
const MAXIMUM_LEAD = Duration.ofHours(2);

/** Ce que l'utilisateur règle : le rappel avant le départ, et la question à l'heure de départ. */
export interface ReminderSettingsProps {
  /** Délai du rappel avant le départ, ou `null` pour ne pas en avoir. */
  readonly departureLead: Duration | null;
  /** Notification à l'heure de départ prévue, pour signaler un départ plus tard. */
  readonly atDeparture: boolean;
}

/**
 * Réglage des notifications de départ : un rappel un peu avant l'heure prévue,
 * et une question à l'heure prévue (« tu pars plus tard ? »). Value object immuable, toujours valide.
 */
export class ReminderSettings {
  private constructor(
    /** Délai avant le départ, ou `null` si le rappel avant le départ est désactivé. */
    readonly departureLead: Duration | null,
    /** `true` si une notification est envoyée à l'heure de départ prévue. */
    readonly atDeparture: boolean,
  ) {}

  /**
   * @param props - Délai du rappel et question à l'heure de départ
   * @returns Le réglage
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h
   */
  static create(props: ReminderSettingsProps): ReminderSettings {
    const lead = props.departureLead;
    if (lead !== null && (lead.isNegative() || lead.isZero() || lead.isGreaterThan(MAXIMUM_LEAD))) {
      throw new InvalidValueError(
        `Le rappel doit être programmé entre 1 min et ${MAXIMUM_LEAD.format()} avant le départ.`,
      );
    }
    return new ReminderSettings(lead, props.atDeparture);
  }

  /** @returns Le réglage par défaut : rappel 15 min avant le départ, et question à l'heure de départ */
  static defaults(): ReminderSettings {
    return new ReminderSettings(Duration.ofMinutes(15), true);
  }

  /** @returns Aucune notification de départ */
  static disabled(): ReminderSettings {
    return new ReminderSettings(null, false);
  }

  /**
   * @param lead - Délai avant l'heure de départ
   * @returns Le réglage avec ce délai, et la question à l'heure de départ
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h
   */
  static departureLead(lead: Duration): ReminderSettings {
    return ReminderSettings.create({ departureLead: lead, atDeparture: true });
  }
}
