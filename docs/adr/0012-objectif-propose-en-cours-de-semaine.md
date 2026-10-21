# 0012 — Objectif proposé en cours de semaine, et plafond du compteur

- Statut : acceptée
- Date : 2026-10-21 (ALT-61)

## Contexte

La simulation proposait toujours 35h. Lancée un mercredi, elle demandait donc 35h sur trois jours :
un objectif irréalisable. L'utilisateur veut voir ce qu'il reste à faire, et le maximum utile.

## Décision

- Le domaine propose l'objectif (`WeekObjectiveAdvisor`) :
  - **fait** : les jours travaillés de la semaine avant la période, avec les heures du plan en cours
    (prévues ou déclarées), sinon le temps attendu (le plan est considéré comme suivi) ;
  - **reste à faire** : temps attendu × jours travaillés (semaine et période) − fait, jamais négatif ;
  - **maximum** : reste à faire + place restante sous le **plafond du compteur**, sans dépasser
    les départs au plus tard de la période.
- Aujourd'hui compte comme fait une fois **l'heure de départ prévue** atteinte : « Cette semaine »
  part alors de demain (`planningPeriodDays` reçoit `todayDone`).
- Nouveau paramètre des règles : **plafond du compteur** (`maximumCredit`, 7h chez La Brosse et Dupont),
  réglable comme le découvert ; absent des réglages plus anciens, celui du preset s'applique.
- À l'écran : le champ vide prend le reste à faire ; deux boutons « Reste à faire » et « Maximum ».

## Alternatives envisagées

- Garder 35h et laisser l'utilisateur calculer : c'est précisément l'erreur à éviter.
- Compter aujourd'hui comme fait dès le matin : on ne pourrait plus replanifier la journée en cours.

## Conséquences

- Le plafond du compteur n'est utilisé que pour proposer le maximum ; le compteur lui-même
  n'est pas écrêté (le recalage sur Smart RH reste la référence).
