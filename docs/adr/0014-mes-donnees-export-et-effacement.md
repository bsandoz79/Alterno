# 0014 — « Mes données » : export JSON et effacement, sans serveur

- Statut : acceptée
- Date : 2026-10-21 (ALT-35, ALT-60)

## Contexte

Le RGPD impose, dès la V1, l'accès et la portabilité des données (export) et leur effacement.
Tout est stocké sur l'appareil (SQLite sur Android, `localStorage` sur le web) : il n'y a ni compte
ni serveur. L'effacement sert aussi à remettre l'app à zéro pour tester (ALT-60).

## Décision

- **Export** (`exportMyData`) : toutes les données relues par les dépôts et converties avec les mêmes
  fonctions que le stockage (durées en minutes, dates AAAA-MM-JJ), en JSON lisible. La semaine
  standard n'est pas exportée (calculée, pas enregistrée) ; du calendrier joint, seules les
  informations (nom, type, taille, date) sont exportées, le fichier restant sur l'appareil.
- **Livraison** : feuille de partage de React Native sur Android (`Share`, aucune dépendance native
  ni nouvel APK), téléchargement d'un fichier sur le web (`share-export.web.ts`).
- **Effacement** (`eraseMyData`) : fichier du calendrier joint, puis toutes les données via un nouveau
  port de l'app `PersonalDataEraser` (SQLite : `DELETE` de chaque table dans une transaction ;
  navigateur : suppression des clés `alterno.*`), puis annulation des notifications programmées.
- Le **test de contrat** remplit chaque dépôt, efface, puis vérifie que chacun est revenu à son état
  initial, sur les deux stockages : une nouvelle donnée oubliée dans l'effacement fait échouer la CI.
- Page « Mes données » (lien depuis l'onglet Compteur) : politique en deux lignes dépliables,
  « Exporter mes données », « Tout effacer » avec confirmation.

## Alternatives envisagées

- `expo-sharing` / `expo-file-system` pour partager un vrai fichier sur Android : nouvelle dépendance
  native, donc nouvel APK, pour un gain faible (le JSON partagé s'enregistre dans Fichiers).
- Supprimer la base SQLite entière : il faudrait la recréer et la migrer, et l'écran resterait
  connecté à l'ancienne ; vider les tables garde le schéma.

## Conséquences

- Toute nouvelle donnée personnelle doit être ajoutée à l'export (`MyDataExport`), à `PERSONAL_TABLES`
  et à `PERSONAL_KEYS` ; le test de contrat de l'effacement signale un oubli.
