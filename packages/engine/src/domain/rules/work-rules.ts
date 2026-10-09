import { InvalidValueError } from '../shared/domain-error';
import type { Duration } from '../time/duration';
import type { DaySchedule } from './day-schedule';
import { WEEKDAY_LABELS, WEEKDAYS, type Weekday } from './weekday';

/** Horaires par jour : un jour absent est un jour non travaillé (week-end par exemple). */
export type WeekSchedule = Readonly<Partial<Record<Weekday, DaySchedule>>>;

/** Paramètres des règles horaires d'une entreprise. */
export interface WorkRulesProps {
  /** Horaires de chaque jour travaillé. */
  readonly week: WeekSchedule;
  /** Pause déjeuner minimale obligatoire (45 min chez La Brosse et Dupont). */
  readonly minimumLunchBreak: Duration;
  /** Temps attendu par jour : au-delà, le surplus alimente le compteur ; en dessous, il y est pris. */
  readonly expectedDailyWork: Duration;
  /** Valeur d'une journée de récupération, déduite du compteur. */
  readonly fullDayRecovery: Duration;
  /** Valeur d'une demi-journée de récupération. */
  readonly halfDayRecovery: Duration;
}

/**
 * Règles horaires de l'entreprise : horaires par jour, pause minimale, temps attendu et récupérations.
 *
 * Ce sont des paramètres (jamais en dur dans le code) : une autre entreprise pourra fournir les siennes.
 * La création vérifie que la configuration est cohérente, pour qu'aucun calcul ne parte d'hypothèses impossibles.
 */
export class WorkRules {
  private constructor(private readonly props: WorkRulesProps) {}

  /**
   * Crée des règles horaires après en avoir vérifié la cohérence.
   *
   * @param props - Paramètres des règles
   * @returns Les règles horaires
   * @throws {InvalidValueError} Si aucun jour n'est travaillé, si une durée n'est pas strictement positive,
   *   si la pause minimale dépasse la plage de déjeuner ou si le temps attendu est inatteignable un jour donné
   */
  static create(props: WorkRulesProps): WorkRules {
    const durations: readonly [string, Duration][] = [
      ['La pause minimale', props.minimumLunchBreak],
      ['Le temps attendu par jour', props.expectedDailyWork],
      ['La journée de récupération', props.fullDayRecovery],
      ['La demi-journée de récupération', props.halfDayRecovery],
    ];
    for (const [label, duration] of durations) {
      if (duration.isNegative() || duration.isZero()) {
        throw new InvalidValueError(`${label} doit être strictement positive.`);
      }
    }

    // Jours travaillés avec leurs horaires : construit en une passe pour ne jamais manipuler d'horaire absent.
    const workingSchedules = WEEKDAYS.flatMap((day) => {
      const schedule = props.week[day];
      return schedule === undefined ? [] : [{ day, schedule }];
    });
    if (workingSchedules.length === 0) {
      throw new InvalidValueError('Les règles doivent comporter au moins un jour travaillé.');
    }

    for (const { day, schedule } of workingSchedules) {
      if (props.minimumLunchBreak.isGreaterThan(schedule.lunchWindow.duration())) {
        throw new InvalidValueError(
          `Le ${WEEKDAY_LABELS[day]}, la pause minimale (${props.minimumLunchBreak.format()}) dépasse la plage de déjeuner (${schedule.lunchWindow.format()}).`,
        );
      }
      const maximum = schedule.maximumSpan().minus(props.minimumLunchBreak);
      if (props.expectedDailyWork.isGreaterThan(maximum)) {
        throw new InvalidValueError(
          `Le ${WEEKDAY_LABELS[day]}, le temps attendu (${props.expectedDailyWork.format()}) dépasse la journée maximale possible (${maximum.format()}).`,
        );
      }
    }

    return new WorkRules({ ...props, week: { ...props.week } });
  }

  /** Pause déjeuner minimale. */
  get minimumLunchBreak(): Duration {
    return this.props.minimumLunchBreak;
  }

  /** Temps attendu par jour travaillé. */
  get expectedDailyWork(): Duration {
    return this.props.expectedDailyWork;
  }

  /** Valeur d'une journée de récupération. */
  get fullDayRecovery(): Duration {
    return this.props.fullDayRecovery;
  }

  /** Valeur d'une demi-journée de récupération. */
  get halfDayRecovery(): Duration {
    return this.props.halfDayRecovery;
  }

  /** @returns Les jours travaillés, dans l'ordre de la semaine */
  workingDays(): readonly Weekday[] {
    return WEEKDAYS.filter((day) => this.isWorkingDay(day));
  }

  /** @returns `true` si `day` est un jour travaillé */
  isWorkingDay(day: Weekday): boolean {
    return this.props.week[day] !== undefined;
  }

  /**
   * Horaires d'un jour travaillé.
   *
   * @param day - Jour de la semaine
   * @returns Les horaires de ce jour
   * @throws {InvalidValueError} Si le jour n'est pas travaillé
   */
  scheduleFor(day: Weekday): DaySchedule {
    const schedule = this.props.week[day];
    if (schedule === undefined) {
      throw new InvalidValueError(`Le ${WEEKDAY_LABELS[day]} n'est pas un jour travaillé.`);
    }
    return schedule;
  }

  /**
   * Journée minimale : uniquement les plages fixes, toute la plage de déjeuner prise en pause.
   *
   * @param day - Jour travaillé
   * @returns Le temps minimal travaillé ce jour-là (5h, ou 4h30 le vendredi)
   * @throws {InvalidValueError} Si le jour n'est pas travaillé
   */
  minimumWorkedTime(day: Weekday): Duration {
    return this.scheduleFor(day).coreDuration();
  }

  /**
   * Journée maximale : arrivée au plus tôt, départ au plus tard, pause minimale seulement.
   *
   * @param day - Jour travaillé
   * @returns Le temps maximal travaillé ce jour-là (10h, ou 9h15 le vendredi)
   * @throws {InvalidValueError} Si le jour n'est pas travaillé
   */
  maximumWorkedTime(day: Weekday): Duration {
    return this.scheduleFor(day).maximumSpan().minus(this.props.minimumLunchBreak);
  }
}
