# 0010 — Semaine standard quand aucun plan n'est validé

- Statut : acceptée
- Date : 2026-10-21 (ALT-51)

## Contexte

Sans simulation validée, l'accueil, la semaine, les rappels et le solde à venir n'avaient rien
à afficher. Or une semaine sans plan particulier est simplement une semaine standard :
temps attendu × jours travaillés (35h chez La Brosse et Dupont).

## Décision

- Le domaine calcule la semaine standard (`DefaultWeekPlanner`) à partir des règles horaires
  (temps attendu, jours travaillés : jamais en dur), au rythme régulier, marquée `isDefault`.
- Règle de priorité : le plan validé gagne dès qu'il a un jour dans la semaine de référence ou après.
  Semaine de référence : celle du jour, ou la suivante le week-end (plus de jour travaillé).
  Semaine d'école : pas de semaine standard. La récup posée par un plan terminé n'est pas travaillée.
- Le dépôt du plan est **décoré** (`PlanWithDefaultWeek`, couche application) : tout ce qui lit
  le plan en cours (accueil, semaine, rappels, solde à venir) en profite sans changement.
- Lire n'enregistre rien. Enregistrer (plan validé, écart déclaré) en fait un plan comme un autre :
  la semaine standard n'est stockée qu'à partir du premier écart.
- Un encadré « Plan par défaut » (accueil et semaine) le signale, avec un lien vers la simulation.

## Alternatives envisagées

- Enregistrer automatiquement une semaine standard chaque lundi : donnée stockée sans action
  de l'utilisateur (contraire à la minimisation RGPD), et besoin d'une tâche planifiée.
- Gérer l'absence de plan dans chaque écran : logique métier répétée dans la présentation.
- Mélanger plan validé et semaine standard semaine par semaine : un écart sur la semaine standard
  aurait recalculé aussi le plan validé des semaines suivantes.

## Conséquences

- Le plan « par défaut » est recalculé à chaque lecture (règles, préférences et semaines d'école
  relues) : il suit immédiatement un changement de réglage.
- Les rappels de départ suivent la semaine standard ; ils sont reprogrammés à l'ouverture de l'app,
  donc la semaine suivante est prise en compte dès qu'on ouvre l'app.
