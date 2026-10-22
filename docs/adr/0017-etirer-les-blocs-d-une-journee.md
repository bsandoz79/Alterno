# 0017 — Étirer les blocs d'une journée (simulation et semaine)

- Statut : acceptée
- Date : 2026-10-22 (ALT-65)

## Contexte

L'utilisateur veut choisir les heures d'un jour en étirant son bloc : le haut pour l'arrivée, le bas
pour le départ, avec l'heure affichée à la minute près pendant le glissement.

- Dans la simulation, il touche un jour du plan proposé pour l'étirer.
- Dans la semaine, il faut d'abord toucher « Modifier », pour ne pas étirer un bloc par erreur en
  faisant défiler l'écran.

Le reste de l'objectif est réparti sur les autres jours, sauf sur les jours étirés, qui restent
verrouillés (il faut l'accord de l'utilisateur pour répartir dessus). À la fin, l'app dit si le plan
tient ou ce qui manque.

## Décision

- **Moteur**
  - `FixedDaysPlanner` reçoit des **jours aux horaires choisis**. Pour chacun, il vérifie les règles
    (`PlanValidator`) et calcule le temps travaillé (`WorkedTimeCalculator`). Ensuite,
    `PlanGenerator.planForTotalHours` répartit le reste : ses journées fixées ont pour minimum et
    maximum leur temps voulu. Enfin, les horaires exacts sont remis sur ces jours.
  - Aucun rythme n'est modifié, puisqu'ils respectent déjà les bornes de chaque jour.
  - Le verdict reprend les messages existants (« il manque 1h15 », « minimum 39h30 »).
  - `SimulatePlan` accepte `fixedDays`, pour un objectif d'heures seulement.
  - Le nouveau cas d'usage `EditPlanDays` répartit le reste sur les **jours à venir** du plan au
    rythme régulier. Les jours passés ne bougent pas, et l'objectif du plan est gardé.
- **App**
  - Le composant partagé `StretchableDay` dessine une journée avec deux poignées. Le geste est suivi
    par `PanResponder`, fourni par React Native et qui marche aussi sur le web : aucune dépendance
    ajoutée.
  - Le calcul de l'heure (`draggedTime`) est une fonction pure testée : déplacement → minutes,
    arrondi à la minute, puis ramené dans la plage autorisée.
  - Les plages viennent des règles (`stretchRanges`), jamais de valeurs en dur.
  - Les jours étirés sont gardés dans un état local (`EditedDays`) tant que rien n'est enregistré.
    Si le plan ne tient pas, deux boutons : « Annuler la dernière modification » ou « Répartir aussi
    sur les jours étirés ».
  - Le découpage en blocs (`dayBlocks`) passe dans `shared/planning`, pour être partagé par la
    grille de la semaine et l'éditeur de la simulation.

## Alternatives envisagées

- `react-native-gesture-handler` et `reanimated` : des gestes plus fluides, mais deux dépendances
  natives pour un glissement vertical simple. Elles restent possibles si `PanResponder` montre ses
  limites sur Android.
- Des boutons − / + d'un quart d'heure (premier essai) : pas assez directs, et pas à la minute près.

## Conséquences

- Sur Android, le défilement de l'écran pourrait gêner le glissement. Les poignées refusent de céder
  le geste (`onPanResponderTerminationRequest`), et le mode « Modifier » évite les gestes involontaires.

## Mise à jour — ALT-69 : dépasser le plan dans la semaine

Dans la semaine, quand les autres jours à venir ne peuvent plus compenser (par exemple, il ne reste
que le vendredi), `EditPlanDays` ne refuse plus. Il passe par `FixedDaysPlanner.closestPlan` : les
horaires choisis sont gardés, les autres jours vont à leur minimum ou à leur maximum, et le total
dépasse l'objectif (ou reste en dessous). L'écran affiche l'écart, qui ira au compteur, comme pour un
écart déclaré : « +1h05 au-delà du plan (20h), pour ton compteur ».

La simulation, elle, reste stricte : son objectif est ce que l'utilisateur demande.
