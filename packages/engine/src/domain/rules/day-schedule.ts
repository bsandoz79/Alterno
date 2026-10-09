import { InvalidValueError } from '../shared/domain-error';
import type { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import type { TimeSlot } from '../time/time-slot';

/** Les cinq plages qui découpent une journée de travail, dans l'ordre chronologique. */
export interface DayScheduleProps {
  /** Plage variable du matin : l'arrivée doit s'y situer (ex. 7h30–9h00). */
  readonly flexibleArrival: TimeSlot;
  /** Plage fixe du matin : présence obligatoire (ex. 9h00–11h45). */
  readonly morningCore: TimeSlot;
  /** Plage de déjeuner : la pause s'y prend, le reste peut être travaillé (ex. 11h45–13h45). */
  readonly lunchWindow: TimeSlot;
  /** Plage fixe de l'après-midi : présence obligatoire (ex. 13h45–16h00, 15h30 le vendredi). */
  readonly afternoonCore: TimeSlot;
  /** Plage variable du soir : le départ doit s'y situer (ex. 16h00–18h15). */
  readonly flexibleDeparture: TimeSlot;
}

/**
 * Horaires d'un jour de travail selon les règles de l'entreprise.
 *
 * Les cinq plages doivent s'enchaîner exactement (la fin de l'une est le début de la suivante) :
 * c'est ce qui garantit qu'une heure de la journée appartient à une seule plage.
 */
export class DaySchedule {
  private constructor(private readonly props: DayScheduleProps) {}

  /**
   * Crée les horaires d'une journée.
   *
   * @param props - Les cinq plages de la journée
   * @returns Les horaires du jour
   * @throws {InvalidValueError} Si les plages ne s'enchaînent pas sans trou ni chevauchement
   */
  static create(props: DayScheduleProps): DaySchedule {
    const chain: readonly [string, TimeSlot][] = [
      ['plage variable du matin', props.flexibleArrival],
      ['plage fixe du matin', props.morningCore],
      ['plage de déjeuner', props.lunchWindow],
      ['plage fixe de l’après-midi', props.afternoonCore],
      ['plage variable du soir', props.flexibleDeparture],
    ];
    chain.forEach(([currentName, current], index) => {
      const previous = chain[index - 1];
      if (previous !== undefined && !previous[1].end.equals(current.start)) {
        throw new InvalidValueError(
          `Les plages doivent s'enchaîner sans trou ni chevauchement : la ${previous[0]} finit à ${previous[1].end.format()}, mais la ${currentName} commence à ${current.start.format()}.`,
        );
      }
    });
    return new DaySchedule(props);
  }

  /** Plage variable du matin (arrivée). */
  get flexibleArrival(): TimeSlot {
    return this.props.flexibleArrival;
  }

  /** Plage fixe du matin. */
  get morningCore(): TimeSlot {
    return this.props.morningCore;
  }

  /** Plage de déjeuner. */
  get lunchWindow(): TimeSlot {
    return this.props.lunchWindow;
  }

  /** Plage fixe de l'après-midi. */
  get afternoonCore(): TimeSlot {
    return this.props.afternoonCore;
  }

  /** Plage variable du soir (départ). */
  get flexibleDeparture(): TimeSlot {
    return this.props.flexibleDeparture;
  }

  /** Heure d'arrivée la plus tôt autorisée. */
  get earliestArrival(): TimeOfDay {
    return this.props.flexibleArrival.start;
  }

  /** Heure d'arrivée la plus tardive autorisée (début de la plage fixe). */
  get latestArrival(): TimeOfDay {
    return this.props.flexibleArrival.end;
  }

  /** Heure de départ la plus tôt autorisée (fin de la plage fixe). */
  get earliestDeparture(): TimeOfDay {
    return this.props.flexibleDeparture.start;
  }

  /** Heure de départ la plus tardive autorisée. */
  get latestDeparture(): TimeOfDay {
    return this.props.flexibleDeparture.end;
  }

  /**
   * Temps passé dans les plages fixes : c'est le minimum travaillé si l'on prend
   * toute la plage de déjeuner en pause (5h du lundi au jeudi, 4h30 le vendredi).
   *
   * @returns La durée cumulée des deux plages fixes
   */
  coreDuration(): Duration {
    return this.props.morningCore.duration().plus(this.props.afternoonCore.duration());
  }

  /**
   * Amplitude maximale de présence : de l'arrivée au plus tôt au départ au plus tard
   * (10h45 du lundi au jeudi, 10h le vendredi), pause comprise.
   *
   * @returns La durée entre l'arrivée la plus tôt et le départ le plus tard
   */
  maximumSpan(): Duration {
    return this.earliestArrival.durationUntil(this.latestDeparture);
  }
}
