import { Duration, TimeOfDay } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import { timeLeftText } from './time-left';

const at = (value: string): TimeOfDay => TimeOfDay.parse(value);

describe('Bandeau « temps restant » de l’accueil', () => {
  it('avant l’arrivée', () => {
    expect(
      timeLeftText({ kind: 'before-start', arrival: at('08:15'), remaining: Duration.ofHours(7) }),
    ).toEqual({ headline: 'Tu commences à 8h15', detail: '7h à faire aujourd’hui' });
  });

  it('au travail : temps restant, puis départ prévu', () => {
    expect(
      timeLeftText({
        kind: 'working',
        departure: at('17:00'),
        remaining: Duration.ofHours(2, 45),
      }),
    ).toEqual({ headline: 'Encore 2h45', detail: 'Départ prévu à 17h00' });
  });

  it('pendant la pause', () => {
    expect(
      timeLeftText({
        kind: 'lunch',
        lunchEnd: at('13:00'),
        departure: at('16:00'),
        remaining: Duration.ofHours(3),
      }),
    ).toEqual({ headline: 'Pause jusqu’à 13h00', detail: 'Encore 3h ensuite · départ à 16h00' });
  });

  it('à l’heure du départ, puis au-delà', () => {
    expect(
      timeLeftText({ kind: 'overtime', departure: at('16:00'), beyond: Duration.zero() }).headline,
    ).toBe('C’est l’heure de partir');
    expect(
      timeLeftText({ kind: 'overtime', departure: at('16:00'), beyond: Duration.ofMinutes(12) }),
    ).toEqual({ headline: '+0h12 au-delà du départ', detail: 'Départ prévu à 16h00' });
  });
});
