# Mobile (frontend)

App Alterno pour Android et le web, en React Native + Expo (React Native Web pour le site).

## Lancer l'app

Depuis la racine du monorepo (une seule fois) : `npm install`, puis :

```
cd apps/mobile
npx expo start
```

- **Téléphone** : scanner le QR code avec l'app Expo Go (Android).
- **PC** : appuyer sur `w` pour ouvrir la version web dans le navigateur.

## Organisation

- `src/app/` : routes Expo Router (un fichier = un écran). Fichiers minces qui pointent vers une feature.
- `src/features/<feature>/` : `screens/`, `components/`, `hooks/`, `adapters/`. Les composants n'appellent jamais directement la base locale ou l'API : ils passent par un hook qui appelle un cas d'usage du moteur.
- `src/shared/` : thème (charte L4 « Rouge et crème »), composants et hooks communs.
