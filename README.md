# Alterno

Planificateur d'horaires variables pour alternants : simule une semaine (ou plus) pour atteindre un objectif d'heures ou une journée de récup, recalcule quand on s'écarte du plan, et affiche l'emploi du temps sur plusieurs semaines.

> Projet personnel en cours de développement — V1 en construction.

## Structure du monorepo

| Dossier | Rôle | Stack |
| --- | --- | --- |
| `packages/engine` | Moteur métier : règles horaires, compteur, plans, alertes | TypeScript pur |
| `apps/mobile` | Frontend : app Android + version web | React Native, Expo |
| `apps/api` | Backend : synchronisation, comptes, RGPD | Symfony, API Platform |
| `docs/adr` | Décisions d'architecture | Markdown |
| `.github/workflows` | Intégration et déploiement continus | GitHub Actions |

Le frontend et le backend ne communiquent que par l'API HTTP. Le moteur ne dépend d'aucun framework.

## Principes

- Architecture en couches (domain → application → infrastructure → presentation) et principes SOLID
- Tests d'abord sur le moteur (TDD)
- RGPD dès la V1 : export et suppression des données, aucun tracker
- 100 % gratuit à héberger

Les règles de développement détaillées sont dans [CLAUDE.md](CLAUDE.md).

## Workflow

Un ticket Plane (`ALT-<n>`) = une branche = des commits conventionnels = une pull request validée par la CI.

```
feature/ALT-12-compute-day-balance
feat(engine): calcule l'écart journalier au compteur [ALT-12]
```

## Démarrer

Ouvrir `alterno.code-workspace` dans VS Code. Les commandes de chaque partie seront ajoutées au fil des jalons.
