# 0004 — Un seul plan en cours, daté

- Statut : acceptée
- Date : 2026-10-11 (ALT-21)

## Contexte

Le moteur génère des plans par jour de la semaine (lundi, mardi…). L'app doit afficher et suivre
le plan sur de vraies dates, sur plusieurs semaines.

## Décision

Le plan validé est un `DatedPlan` : chaque journée porte sa `CalendarDate`. Les cas d'usage
(`SimulatePlan`, `DeclareDeviation`) traduisent dates ↔ jours de la semaine ; le domaine reste
indépendant du calendrier. **Un seul plan en cours** en V1 : valider une simulation, ou enregistrer
une modification de jour, le remplace entièrement (`ValidatePlan`).

## Alternatives envisagées

- **Historique de plans** : utile pour le suivi réel, mais hors V1.

## Conséquences

- Simple à stocker (une ligne par journée) et à afficher (grille, mois, accueil).
- Valider « Cette semaine » écrase un plan qui commençait la semaine suivante : l'accueil
  l'indique (« ton plan commence le… »).
