# 0009 — Android : APK interne avec EAS Build, mises à jour avec EAS Update

- Statut : acceptée
- Date : 2026-10-13 (ALT-38)

## Contexte

Expo Go suffit pour développer, mais ne charge pas certains modules (expo-notifications depuis le SDK 53).
Il faut une app installée sur le téléphone, sans passer par le Play Store, et gratuite.

## Décision

- **EAS Build**, profil `preview` (`apps/mobile/eas.json`) : APK (`buildType: apk`) en distribution interne,
  installé en ouvrant le lien du build sur le téléphone. Identifiant Android : `com.bsandoz.alterno`.
- **EAS Update** (`expo-updates`), canal `preview` : le code JavaScript se met à jour sans reconstruire l'APK.
  `runtimeVersion` suit la `version` de l'app (`policy: appVersion`) : une mise à jour n'atteint que les APK
  de la même version, donc compatibles avec ses modules natifs.
- `eas-cli` est lancé avec `npx eas-cli@latest`, sans l'ajouter aux dépendances du projet.
- Icône de notification blanche (96 px) tirée de l'icône monochrome, couleur rouge de la charte.

## Alternatives envisagées

- Build local avec Android Studio (`expo run:android`) : lourd à installer, et l'APK dépend du PC.
- Build de développement (`expo-dev-client`) : utile pour déboguer du natif, mais nécessite Metro lancé ;
  l'APK `preview` est l'app réelle, utilisable au quotidien.
- AAB pour le Play Store : inutile tant que l'app n'est pas publiée.

## Conséquences

- Compte Expo nécessaire ; l'offre gratuite limite le nombre de builds par mois (file d'attente partagée).
- Changer l'identifiant `com.bsandoz.alterno` plus tard créerait une autre app sur le téléphone (données non reprises).
- Ajouter un module natif ou changer `version` impose un nouvel APK.
