import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';

/** Délai maximal du rappel : au-delà, il ne rappelle plus vraiment l'heure de départ. */
const MAXIMUM_LEAD = Duration.ofHours(2);
/** Délais du suivi de la récup, en jours : au-delà d'une semaine, la relance ne sert plus. */
const MINIMUM_APPROVAL_DAYS = 1;
const MAXIMUM_APPROVAL_DAYS = 7;
/** Par défaut : première question 48h après la demande, puis relance toutes les 24h. */
const DEFAULT_APPROVAL_FIRST_DELAY_DAYS = 2;
const DEFAULT_APPROVAL_REPEAT_DAYS = 1;

/**
 * Ce que l'utilisateur règle : le rappel avant le départ, la question à l'heure de départ,
 * la question de fin de semaine et le suivi de la demande de récup.
 * Les réglages ajoutés après coup sont facultatifs : absents, ils prennent leur valeur par défaut.
 */
export interface ReminderSettingsProps {
  /** Délai du rappel avant le départ, ou `null` pour ne pas en avoir. */
  readonly departureLead: Duration | null;
  /** Notification à l'heure de départ prévue, pour signaler un départ plus tard. */
  readonly atDeparture: boolean;
  /** Question de fin de semaine (« Ta semaine s'est passée comme prévu ? ») ; activée par défaut. */
  readonly weekCheck?: boolean;
  /** Question « Ta récup a-t-elle été acceptée ? » ; activée par défaut. */
  readonly approvalCheck?: boolean;
  /** Jours entre la demande de récup et la première question (2 par défaut). */
  readonly approvalFirstDelayDays?: number;
  /** Jours entre deux relances sans réponse (1 par défaut). */
  readonly approvalRepeatDays?: number;
}

/**
 * Réglage des notifications : un rappel un peu avant l'heure de départ prévue,
 * une question à l'heure prévue (« tu pars plus tard ? »), une question en fin de semaine
 * (« ta semaine s'est passée comme prévu ? ») et le suivi de la demande de récup.
 * Value object immuable, toujours valide.
 */
export class ReminderSettings {
  /** Délai avant le départ, ou `null` si le rappel avant le départ est désactivé. */
  readonly departureLead: Duration | null;
  /** `true` si une notification est envoyée à l'heure de départ prévue. */
  readonly atDeparture: boolean;
  /** `true` si la question de fin de semaine est posée. */
  readonly weekCheck: boolean;
  /** `true` si l'on demande si la récup a été acceptée. */
  readonly approvalCheck: boolean;
  /** Jours entre la demande de récup et la première question. */
  readonly approvalFirstDelayDays: number;
  /** Jours entre deux relances. */
  readonly approvalRepeatDays: number;

  private constructor(props: Required<ReminderSettingsProps>) {
    this.departureLead = props.departureLead;
    this.atDeparture = props.atDeparture;
    this.weekCheck = props.weekCheck;
    this.approvalCheck = props.approvalCheck;
    this.approvalFirstDelayDays = props.approvalFirstDelayDays;
    this.approvalRepeatDays = props.approvalRepeatDays;
  }

  /**
   * @param props - Les réglages ; ceux qui manquent prennent leur valeur par défaut
   * @returns Le réglage
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h,
   *   ou si un délai de suivi de la récup n'est pas un nombre entier de jours entre 1 et 7
   */
  static create(props: ReminderSettingsProps): ReminderSettings {
    const lead = props.departureLead;
    if (lead !== null && (lead.isNegative() || lead.isZero() || lead.isGreaterThan(MAXIMUM_LEAD))) {
      throw new InvalidValueError(
        `Le rappel doit être programmé entre 1 min et ${MAXIMUM_LEAD.format()} avant le départ.`,
      );
    }
    const firstDelay = props.approvalFirstDelayDays ?? DEFAULT_APPROVAL_FIRST_DELAY_DAYS;
    const repeat = props.approvalRepeatDays ?? DEFAULT_APPROVAL_REPEAT_DAYS;
    if (!isApprovalDays(firstDelay) || !isApprovalDays(repeat)) {
      throw new InvalidValueError(
        `Le suivi de la récup se règle en jours entiers, de ${String(MINIMUM_APPROVAL_DAYS)} à ${String(MAXIMUM_APPROVAL_DAYS)}.`,
      );
    }
    return new ReminderSettings({
      departureLead: lead,
      atDeparture: props.atDeparture,
      weekCheck: props.weekCheck ?? true,
      approvalCheck: props.approvalCheck ?? true,
      approvalFirstDelayDays: firstDelay,
      approvalRepeatDays: repeat,
    });
  }

  /**
   * @returns Le réglage par défaut : rappel 15 min avant le départ, question à l'heure de départ,
   * question de fin de semaine et suivi de la récup (48h, puis toutes les 24h)
   */
  static defaults(): ReminderSettings {
    return ReminderSettings.create({ departureLead: Duration.ofMinutes(15), atDeparture: true });
  }

  /** @returns Aucune notification */
  static disabled(): ReminderSettings {
    return ReminderSettings.create({
      departureLead: null,
      atDeparture: false,
      weekCheck: false,
      approvalCheck: false,
    });
  }

  /**
   * @param lead - Délai avant l'heure de départ
   * @returns Le réglage avec ce délai, et les autres notifications par défaut
   * @throws {InvalidValueError} Si le délai n'est pas strictement positif ou dépasse 2h
   */
  static departureLead(lead: Duration): ReminderSettings {
    return ReminderSettings.create({ departureLead: lead, atDeparture: true });
  }
}

/** Délai de suivi valide : un nombre entier de jours, d'une journée à une semaine. */
function isApprovalDays(days: number): boolean {
  return Number.isInteger(days) && days >= MINIMUM_APPROVAL_DAYS && days <= MAXIMUM_APPROVAL_DAYS;
}
