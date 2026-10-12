# 0007 — Calendrier annuel joint : port côté app, copie via `content://`

- Statut : acceptée
- Date : 2026-10-12 (ALT-25)

## Contexte

L'utilisateur peut joindre son calendrier d'alternance (PDF ou image) pour le consulter dans l'app.
C'est un fichier, sans règle métier.

## Décision

- Le port `AnnualCalendarStore` vit **dans l'app** (`shared/storage`), pas dans le moteur.
- Android : le fichier est copié dans le dossier « documents » de l'app (`expo-file-system`), ses
  informations dans la table `annual_calendar`. L'accès aux fichiers est injecté (`DocumentFiles`)
  pour être testé sans téléphone. Ouverture dans le lecteur du téléphone (`expo-intent-launcher`,
  action VIEW sur l'adresse `content://`).
- Web : contenu gardé en « data URL » dans le navigateur, ouvert dans un nouvel onglet (Blob). 2 Mo maximum.
- Sélection avec `expo-document-picker` en **`copyToCacheDirectory: false`** : `expo-file-system`
  refuse de copier un `file://` situé hors du dossier de l'app (cas du cache du sélecteur dans Expo Go),
  mais accepte l'adresse `content://` fournie par Android.

## Alternatives envisagées

- `expo-image-picker` : images seulement, pas de PDF.
- `expo-sharing` : menu « Partager » au lieu d'une ouverture directe.

## Conséquences

- Deux dépendances Expo (gratuites, officielles).
- Le fichier est une donnée personnelle : la suppression du compte devra l'effacer (ALT-35).
