# Engine

Moteur métier d'Alterno, en TypeScript pur : règles horaires, calcul du compteur, génération des plans selon le rythme choisi, détection des écarts et alertes.

Règle d'or : **aucune dépendance** à React, Expo, une base de données ou au réseau. Tout ce qui touche l'extérieur passe par des interfaces (`Clock`, repositories…) implémentées ailleurs.

## Organisation

```
src/
  domain/        # Entités, value objects, règles, interfaces (ports)
  application/   # Cas d'usage
  index.ts       # Point d'entrée public
```

Les tests sont à côté du code : `duration.ts` → `duration.test.ts`.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm test` | Lance les tests (Vitest) |
| `npm run test:watch` | Tests en continu pendant le développement |
| `npm run test:coverage` | Tests + couverture |
| `npm run lint` | ESLint (règles TypeScript strictes) |
| `npm run typecheck` | Vérification des types |
| `npm run check:architecture` | Contrôle des dépendances entre couches (dependency-cruiser) |
