# 0015 — Partir plus tard ou arriver plus tôt : bout de journée choisi par jour

- Statut : acceptée
- Date : 2026-10-22 (ALT-64)

## Contexte

Jusqu'ici, une journée plus longue faisait toujours partir plus tard, et une journée plus courte
partir plus tôt : l'arrivée habituelle restait fixe. L'utilisateur veut choisir, jour par jour,
d'arriver plus tôt à la place. Il veut aussi un vendredi court : partir à 15h30 sans arriver
plus tôt, les heures manquantes allant sur les autres jours.

## Décision

- Deux préférences par jour, dans `DayPreferences` :
  - `flexibleEnd` (`'departure'` par défaut, ou `'arrival'`) : le bout de journée qui bouge.
    Avec `'arrival'`, le **départ d'une journée de 7h** commencée à l'heure habituelle reste fixe,
    et l'arrivée avance (heures en plus) ou recule (heures en moins). Ce départ est calculé : pas de
    nouveau champ « départ habituel » à saisir.
  - `earliestArrival` : arrivée au plus tôt, symétrique du départ au plus tard. Elle réduit le
    maximum du jour, et le rythme reporte le reste sur les autres jours. Elle ne peut pas suivre
    l'arrivée habituelle, qui sert de point de départ au plan.
- `DayConstraints` reste le point unique où règles et préférences se rencontrent. Il gagne
  `earliestArrivalFor`, `flexibleEndFor`, `lunchDurationFor` et `habitualDepartureFor`.
  `DayTimetableBuilder` borne chaque heure. Quand un bout est bloqué, l'autre prend le relais,
  et la pause absorbe l'écart restant.
- Côté app :
  - choix « Heures en plus : Partir plus tard / Arriver plus tôt » et champ « Arrivée au plus tôt »
    dans les préférences par jour ;
  - stockage JSON inchangé dans sa forme : seuls les champs réglés sont écrits, donc pas de
    migration SQLite ;
  - l'export « Mes données » reprend ces champs.

## Alternatives envisagées

- Un booléen « ne pas arriver plus tôt » : il couvre le vendredi, mais pas un jour où l'on accepte
  d'arriver un peu plus tôt jusqu'à une certaine heure.
- Saisir un départ habituel par jour : un champ de plus pour une valeur que l'on peut déduire de
  l'arrivée, de la pause et des 7h.

## Conséquences

- Le vendredi court se règle avec deux champs : arrivée au plus tôt = arrivée habituelle, et départ
  au plus tard = 15h30.
- ALT-67 (garder l'heure d'arrivée préférée au recalcul) pourra s'appuyer sur `flexibleEnd` et
  `earliestArrival`.
