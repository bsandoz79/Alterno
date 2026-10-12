# 0006 — Semaines d'école stockées en lundis

- Statut : acceptée
- Date : 2026-10-12 (ALT-26)

## Contexte

Le rythme d'alternance se raisonne par semaines (ex. 1 semaine d'école, 2 en entreprise).
Ces jours-là, il n'y a pas d'horaire à planifier.

## Décision

Value object immuable `SchoolWeeks` dans le moteur, stocké sous forme de lundis (`AAAA-MM-JJ`) :
n'importe quel jour retrouve sa semaine (`contains`), on marque une semaine d'un appui (`toggle`).
`planningPeriodDays` exclut les jours d'école des simulations. Dans l'affichage, **le plan l'emporte
sur l'école** : un plan validé avant le marquage reste visible jusqu'à la prochaine simulation.

## Alternatives envisagées

- **Jours typés un par un** (école, entreprise, férié, congé) : prévu en V2 ; trop fin pour la V1.

## Conséquences

- Saisie rapide, stockage minimal (RGPD).
- L'import automatique du calendrier (ALT-40) produira ce même `SchoolWeeks`, validé sur l'écran de marquage.
