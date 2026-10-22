# 0018 — Historique : archive des journées passées

- Statut : acceptée
- Date : 2026-10-22 (ALT-52)

## Contexte

Le plan en cours est remplacé à chaque validation, ce qui efface les jours déjà faits. Pour voir les
heures travaillées par mois et depuis le début du contrat, il faut garder ces journées ailleurs.

## Décision

- **Archive** : nouveau port `DayArchiveRepository`, avec deux opérations :
  - `loadAll` lit toutes les journées ;
  - `save` les ajoute, ou remplace une journée de même date.

  Chaque journée (`ArchivedDay`) contient : la date, le type (travail, récup, demi-récup, école), le
  temps travaillé, le temps attendu, et les horaires quand elle a été travaillée.
- **Remplissage** : `DayArchiver` traduit les jours passés d'un plan, selon la règle « plan considéré
  comme suivi ».
  - Un jour de travail vaut ce que le plan prévoit, écarts déclarés compris.
  - Une récup est un jour attendu mais non travaillé : 0h sur 7h pour une journée, 3h30 sur 7h pour
    une demi-journée.
  - Une semaine d'école n'attend rien.
- **Quand** :
  - avant chaque enregistrement d'un plan : le décorateur `ArchivingPlanRepository` archive avant que
    l'ancien plan soit remplacé ;
  - à chaque ouverture de l'Historique : le cas d'usage `LoadHistory` archive jusqu'à hier, puis résume.
  - Deux sources sont archivées : le plan enregistré et le plan affiché (semaine standard comprise).
- **Résumé** : `summarizeHistory` calcule, mois par mois, les heures faites et attendues, l'écart, les
  jours travaillés, les récups (une demi-journée compte 0,5) et les jours d'école. Il calcule aussi le
  total depuis le début du contrat et l'écart cumulé à la fin de chaque mois, qui sert de courbe.
- **Début du contrat** : nouveau port `ContractStartRepository`. La date se saisit dans l'Historique.
- **Stockage** :
  - SQLite, migration 13 : tables `day_archive` (une ligne par date) et `contract` ;
  - navigateur : clés `alterno.history` et `alterno.contractStart`.

  Les deux sont couverts par l'export (« Mes données ») et par l'effacement (`PERSONAL_TABLES` et
  `PERSONAL_KEYS`).
- **Graphique** : dessiné avec de simples vues (barres par mois). Aucune bibliothèque n'est ajoutée.

## Alternatives envisagées

- Garder tous les plans successifs : plus lourd, avec des doublons à départager quand deux plans se
  chevauchent.
- Archiver au premier plan de l'app (au démarrage) : il faudrait une tâche de fond. Archiver avant
  chaque remplacement de plan et à l'ouverture de l'Historique suffit à ne rien perdre.

## Conséquences

- L'écart cumulé vient seulement de l'archive : il peut différer du compteur recalé sur Smart RH, par
  exemple à cause d'heures d'avant Alterno ou de corrections de la RH. L'écran le dit.
- Les jours sans aucun plan (avant la première utilisation) n'apparaissent pas.
