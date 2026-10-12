# 0001 — Vitest pour tous les tests TypeScript

- Statut : acceptée
- Date : 2026-10-10 (ALT-3, ALT-17)

## Contexte

Le moteur (`packages/engine`) et l'app (`apps/mobile`) sont en TypeScript strict, en modules ES.
Le cahier des charges prévoyait Jest (via `jest-expo` côté mobile).

## Décision

Vitest est utilisé partout : moteur et app mobile. Côté mobile, on ne teste pas le rendu React Native :
on teste la logique extraite en fonctions pures (formulaires, vues calendrier, accueil) et les
adaptateurs de stockage. La base SQLite est simulée avec `node:sqlite`.

## Alternatives envisagées

- **Jest + jest-expo** : outil standard d'Expo, mais configuration plus lourde (transformations Babel,
  ESM), deux outils différents dans le monorepo.

## Conséquences

- Un seul outil, une seule syntaxe (`describe` / `it` / `expect`) et une couverture v8 identique partout.
- Les composants React ne sont pas testés unitairement : ils restent minces (hooks + fonctions pures)
  et sont vérifiés en lançant l'app (web exporté + Playwright, puis Expo Go). Les tests e2e (Maestro)
  viendront plus tard.
