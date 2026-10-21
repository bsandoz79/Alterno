# 0013 — Annuler un plan ou sa récup : journées standard, sans vider le dépôt

- Statut : acceptée
- Date : 2026-10-21 (ALT-54)

## Contexte

Une récup peut être refusée ou ne plus servir, et un écart peut rendre le plan irréalisable.
Il faut pouvoir revenir en arrière sans perdre ce qui a été fait.

## Décision

- Le domaine annule (`PlanCanceller`), en s'appuyant sur `StandardDayPlanner` (journées au temps
  attendu, rythme régulier), partagé avec la semaine standard (ADR 0010) :
  - **annuler le plan** à partir d'un jour : les jours d'avant sont gardés, la fin de la semaine
    repasse en journées standard, la récup à venir est annulée (une récup passée reste visible) ;
    les semaines suivantes reprennent la semaine standard ;
  - **annuler la récup** : son jour redevient travaillé, les jours restants repassent en journées
    standard ; l'avance déjà faite reste au compteur (seul le plan change).
- Cas d'usage `CancelPlan` et `CancelRecovery`. Le plan annulé est **enregistré** comme un autre :
  pas de méthode « vider le dépôt » dans le port `PlanRepository` (un plan sans jour à venir laisse
  la semaine standard reprendre). Les rappels sont reprogrammés par le décorateur du dépôt.
- Écrans : « Annuler le plan » sur la semaine, « Annuler la récup » sur « Ma récup » (proposé après
  un refus), et, quand un écart rend le plan irréalisable, « Garder et prendre sur le compteur »
  ou « Annuler le plan » (la journée saisie est gardée, l'annulation commence le lendemain).
- Confirmation dans l'écran (pas de boîte de dialogue, rendue différemment sur le web).

## Alternatives envisagées

- Ajouter `clearCurrent()` au port : toutes les implémentations et doublures de test à modifier,
  pour un résultat identique à l'enregistrement d'un plan sans jour à venir.
- Supprimer tout le plan : on perdrait les heures réelles des jours passés de la semaine,
  utilisées pour l'objectif proposé (ADR 0012).

## Conséquences

- Une annulation ne se défait pas : la confirmation explique ce qui va changer.
