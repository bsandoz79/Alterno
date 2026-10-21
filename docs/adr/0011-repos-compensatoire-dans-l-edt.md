# 0011 — Repos compensatoire dans l'EDT : moitié choisie, horaires calculés

- Statut : acceptée
- Date : 2026-10-21 (ALT-56)

## Contexte

Le jour de récup n'apparaissait que comme une étiquette « Récup » dans la grille. Pour une
demi-journée, il faut montrer la partie travaillée et la partie en repos (ex. travail 9h00–12h30,
repos 12h30–16h00), et savoir si le repos est le matin ou l'après-midi.

## Décision

- Le plan enregistre seulement la **moitié en repos** (`PlannedRecovery.part` : `morning` /
  `afternoon`, colonne `part` de `plan_recovery`, migration v11). Absente : l'après-midi,
  comme pour les plans validés avant.
- Les horaires sont **calculés** par le domaine (`RecoveryDayTimetable`) à partir des règles :
  partie travaillée = temps attendu − valeur de la demi-journée (7h − 3h30), sans pause ;
  après-midi en repos : travail dès le début de la plage fixe du matin, puis repos ;
  matin en repos : repos, puis travail jusqu'à la fin de la plage fixe de l'après-midi
  (15h30 le vendredi). La partie travaillée couvre toujours la plage fixe de sa moitié.
- Libellés : « récup » dans les petits boutons et sous la grille, « Repos compensatoire »
  dans les titres et dans l'EDT (bloc vert doux, distinct du travail et de la pause).
- L'accueil annonce le repos compensatoire du jour, avec les horaires d'une demi-journée.

## Alternatives envisagées

- Enregistrer les horaires de travail et de repos : données dérivées en double, qui ne suivraient
  pas un changement de règles (contraire à la minimisation).
- Laisser l'utilisateur saisir les horaires de la demi-journée : plus de saisie, pour un cas
  que les règles suffisent à calculer.

## Conséquences

- Les écrans qui dessinent la récup relisent les règles horaires (hook `useRecoveryDay`).
- Pas de rappel de départ pour la partie travaillée d'une demi-journée (le jour de récup n'est pas
  une journée du plan) : à proposer en ticket si besoin.
