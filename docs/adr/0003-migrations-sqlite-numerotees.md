# 0003 — Migrations SQLite numérotées

- Statut : acceptée
- Date : 2026-10-10 (ALT-17)

## Contexte

Le schéma de la base locale évolue à chaque ticket (plan, réglages, préférences, semaines d'école,
calendrier joint…), alors que l'app est déjà installée sur un téléphone avec des données.

## Décision

`migrate-database.ts` contient une liste ordonnée de migrations SQL. La version du schéma est stockée
dans la base (`PRAGMA user_version`) : au démarrage, seules les migrations plus récentes sont jouées,
chacune dans une transaction. **Une migration publiée ne se modifie jamais** : on en ajoute une nouvelle.

Versions : 1 compteur + plan, 2 réglages, 3 préférences, 4 plan daté (table recréée, aucune donnée
publiée à reprendre), 5 semaines d'école, 6 calendrier annuel.

## Alternatives envisagées

- **Recréer la base à chaque changement** : perte des données de l'utilisateur.
- **Un outil de migration (ORM)** : dépendance de plus pour un besoin simple.

## Conséquences

- Les tests vérifient la mise à jour d'une base ancienne (`migrateDatabase(db, 1)` puis la dernière version).
- Côté web, pas de schéma : chaque dépôt lit son JSON, absent = valeur par défaut.
