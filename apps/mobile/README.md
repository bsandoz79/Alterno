# Mobile (frontend)

App Alterno pour Android et le web, en React Native + Expo (React Native Web pour le site).

## Lancer l'app

Depuis la racine du monorepo (une seule fois) : `npm install`, puis :

```
cd apps/mobile
npx expo start
```

- **Téléphone** : scanner le QR code avec l'app Expo Go (Android). Téléphone et PC sur le même Wi-Fi ; touche `r` pour recharger après une modification.
- **PC** : appuyer sur `w` pour ouvrir la version web dans le navigateur.

Le bandeau « Cannot connect to Expo CLI » d'Expo Go signale seulement que le téléphone a perdu le serveur de développement (souvent après être passé par une autre app) : relancer `npx expo start` ou recharger.

## Tests

```
npm test               # logique pure et stockage (Vitest)
npm run test:coverage  # avec couverture
```

Les écrans ne sont pas testés unitairement : la logique est extraite en fonctions pures, testées à côté (`week-view.ts` → `week-view.test.ts`). Voir [ADR 0001](../../docs/adr/0001-vitest-pour-tous-les-tests-typescript.md).

## Organisation

- `src/app/` : routes Expo Router (un fichier = un écran). Fichiers minces qui pointent vers une feature.
- `src/features/<feature>/` : `screens/`, `components/`, `hooks/`, `adapters/`. Les composants n'appellent jamais directement la base locale ou l'API : ils passent par un hook qui appelle un cas d'usage du moteur.
- `src/shared/` : thème (charte L4 « Rouge et crème »), composants, hooks, formats de date, accès aux fichiers et stockage communs.

## Écrans

| Route | Feature | Rôle |
| --- | --- | --- |
| `/` | `today` | Accueil : départ prévu, reste de la semaine, « Signaler un changement » |
| `/semaine` | `calendar` | Planning en grille semaine ou vue mois |
| `/jour/[date]` | `deviations` | Détail et modification d'un jour, recalcul (`?change=…` : une seule heure à saisir) |
| `/simulation` | `simulation` | Simuler, comparer les rythmes, valider un plan |
| `/compteur` | `counter` | Solde d'heures |
| `/reglages` | `settings` | Règles horaires |
| `/preferences` | `preferences` | Préférences par jour |
| `/ecole` | `school-weeks` | Marquage des semaines d'école |
| `/calendrier-annuel` | `annual-calendar` | Calendrier d'alternance joint |

## Stockage

Un port par donnée, deux adaptateurs : SQLite sur Android (`shared/storage/sqlite`), stockage du navigateur sur le web (`shared/storage/browser`). Metro choisit le bon fichier selon la plateforme (`*.web.tsx`). Un test de contrat vérifie que les deux se comportent pareil. Voir [ADR 0002](../../docs/adr/0002-stockage-local-un-port-deux-adaptateurs.md) et [ADR 0003](../../docs/adr/0003-migrations-sqlite-numerotees.md).

Toute nouvelle donnée stockée doit être ajoutée à la liste RGPD du ticket « Mes données » (ALT-35).
