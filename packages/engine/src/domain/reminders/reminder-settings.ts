import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';

/** Délai maximal du rappel : au-delà, il ne rappelle plus vraiment l'heure de départ. */
const MAXIMUM_LEAD = Duration.ofHours(2);

/**
 * Ce que l'utilisateur règle : le rappel avant le départ, la question à l'heure de départ,
 * et la question de fin de semaine.
 */
export interface ReminderSettingsProps {
  /** Délai du rappel avant le départ, ou `null` pour ne pas en avoir. */
  readonly departureLead: Duration | null;
  /** Notification à l'heure de départ prévue, pour signaler un départ plus tard. */
  readonly atDeparture: boolean;
  /**
   * Question de fin de semaine (« Ta semaine s'est passée comme prévu ? ») ;
   * absente = activée, comme par défaut.
   */
  readonly weekCheck?: boolean;
}

/**
 * Réglage des notifications : un rappel un peu avant l'heure de départ prévue,
 * une question à l'heure prévue (« tu pars plus tard ? ») et une question en fin de semaine
 * (« ta semaine s'est passée comme prévu ? »). Value object immuable, toujours valide.
 */
export class ReminderSettings {
  private constructor(
    /** Délai avant le départ, ou `null` si le rappel avant le départ est désactivé. */
    readonly departureLead: Duration | null,
    /** `true` si une notification est envoyée à l'heure de départ prévue. */
    readonly atDeparture: boolean,
    /** `true` si la question de fin de semaine est posée. */
    readonly weekCheck: boolean,
  ) {}

  /**
   * @param props - Délai du rappel, question à l'heure de départ et question de fin de semaine
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
    return new ReminderSettings(lead, props.atDeparture, props.weekCheck ?? true);
  }

  /**
   * @returns Le réglage par défaut : rappel 15 min avant le départ, question à l'heure de départ
   * et question de fin de semaine
   */
  static defaults(): ReminderSettings {
    return new ReminderSettings(Duration.ofMinutes(15), true, true);
  }

  /** @returns Aucune notification */
  static disabled(): ReminderSettings {
    return new ReminderSettings(null, false, false);
  }

  /**
   * @param lead - Délai avant l'heure de départ
   * @returns Le réglage avec ce délai, la question à l'heure de départ et celle de fin de semaine
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h
   */
  static departureLead(lead: Duration): ReminderSettings {
    return ReminderSettings.create({ departureLead: lead, atDeparture: true });
  }
}
