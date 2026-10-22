# 0016 — Garder son heure d'arrivée quand un recalcul la repousse

- Statut : acceptée
- Date : 2026-10-22 (ALT-67)

## Contexte

Après un écart (parti plus tard un jour), les jours suivants ont moins d'heures à faire. Quand le
départ est déjà à la fin de la plage fixe (16h00), le recalcul ne peut réduire la journée qu'en
faisant arriver plus tard. Exemple vécu : arrivée à 8h50 le jeudi au lieu de 8h20. L'utilisateur
veut pouvoir garder son heure, quitte à faire plus que l'objectif.

## Décision

- Le domaine ajoute `ArrivalKeeper`, à côté de `DeviationReplanner`, qui n'est pas modifié :
  - `lateArrivals` repère les jours, après l'écart, dont l'arrivée prévue est plus tardive que
    l'arrivée habituelle ;
  - `keep` leur donne l'arrivée habituelle, ou une heure choisie (`ArrivalChoice`).
- Avec `keep`, le **départ et la pause sont gardés**. Le temps travaillé est recalculé par les
  règles (`WorkedTimeCalculator`), et le plan dépasse l'objectif du temps gagné, qui va au compteur.
- L'heure choisie doit rester entre l'arrivée au plus tôt (7h30, ou la préférence du jour, ADR 0015)
  et le début de la plage fixe.
- `DeclareDeviation` signale ces jours (`lateArrivals`, datés) et accepte un choix facultatif
  (`arrival`). Les jours sont repérés sur le recalcul, ce qui permet de garder les choix affichés une
  fois l'un d'eux fait.
- L'écran « Modifier ce jour » ajoute une carte « Arrivée repoussée » :
  - trois choix : **Garder 8h20** / **Recalcul** (par défaut) / **Autre heure** ;
  - l'effet sur le plan s'affiche avant d'enregistrer (« +0h30 sur le plan, pour ton compteur ») ;
  - une heure illisible ou hors plage n'efface pas le recalcul : un message s'affiche et
    l'enregistrement est bloqué jusqu'à correction.

## Alternatives envisagées

- Garder l'arrivée en redistribuant les heures sur les autres jours : l'objectif serait tenu, mais
  ce n'est pas ce que l'utilisateur demande (faire plus en arrivant à son heure).
- Intégrer le choix dans `DeviationReplanner` : la classe aurait deux responsabilités (recalculer et
  ajuster les arrivées). Une classe à part se teste et s'enlève seule.

## Conséquences

- Le plafond du compteur (7h) n'est pas appliqué ici : le surplus est affiché, et c'est le compteur
  qui l'écrêtera.
