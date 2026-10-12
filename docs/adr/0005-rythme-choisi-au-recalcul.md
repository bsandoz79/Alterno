# 0005 — Rythme choisi à chaque recalcul

- Statut : acceptée
- Date : 2026-10-12 (ALT-24)

## Contexte

Quand un jour change (départ plus tôt…), le rattrapage est réparti sur les jours suivants selon un
rythme (rapide, régulier, au plus juste). Le plan enregistré ne mémorise pas le rythme choisi en simulation.

## Décision

L'utilisateur choisit le rythme sur l'écran de modification, **Régulier par défaut**. Rien n'est stocké.
Le nom du rythme est traduit en stratégie par `paceStrategy` (`application/pace-name.ts`),
partagé par `SimulatePlan` et `DeclareDeviation`.

## Alternatives envisagées

- **Mémoriser le rythme avec le plan** : une donnée et une migration de plus.
- **Toujours régulier** : ignore la préférence de l'utilisateur.

## Conséquences

- Aucune donnée supplémentaire ; le choix reste visible et modifiable à chaque recalcul.
- Un nom de rythme désigne la même stratégie partout (une seule correspondance).
