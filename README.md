# Alterno

[![CI](https://github.com/bsandoz79/Alterno/actions/workflows/ci.yml/badge.svg)](https://github.com/bsandoz79/Alterno/actions/workflows/ci.yml)

Planificateur d'horaires variables pour alternants : simule une semaine (ou plus) pour atteindre un objectif d'heures ou une journée de récup, recalcule quand on s'écarte du plan, et affiche l'emploi du temps sur plusieurs semaines.

> Projet personnel en cours de développement — V1 en construction (fonctionne en local, sans serveur).

## Ce que fait l'app aujourd'hui

- **Aujourd'hui** : heure de départ prévue en grand, reste de la semaine, bouton « Signaler un changement » (arrivé plus tard, parti plus tôt, pause plus longue).
- **Simulation** : période (cette semaine / semaine prochaine, 1 à 4 semaines), objectif d'heures ou récup (jours impossibles barrés avec les heures qui manquent, découvert de 4h max utilisé seulement si besoin), comparaison des rythmes rapide / régulier / au plus juste, validation du plan.
- **Planning** : grille semaine façon EDT, vue mois, détail et modification d'un jour avec recalcul de la suite.
- **Compteur** : solde d'heures (alerte au-delà du découvert autorisé), solde à venir à la fin du plan (récup comprise), recalage sur Smart RH, rappel avant l'heure de départ (notification Android), règles horaires et préférences par jour paramétrables.
- **Alternance** : semaines d'école (exclues des simulations), calendrier annuel joint (PDF ou image).

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

Prérequis : Node.js 24 et npm. Ouvrir `alterno.code-workspace` dans VS Code.

```
npm install            # depuis la racine, à refaire après chaque ajout de dépendance
npm test               # tests du moteur et de l'app
cd apps/mobile && npx expo start   # QR code pour Expo Go (Android), touche w pour le web
```

Avant de pousser, la CI rejoue : `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:architecture`.

## Installer l'app sur Android (APK)

Expo Go suffit pour développer, mais certaines fonctions (rappels de départ) n'existent que dans l'app installée.
L'APK est construit par EAS Build (gratuit, compte expo.dev), depuis `apps/mobile` :

```
npx eas-cli@latest login                                   # une seule fois
npx eas-cli@latest init                                    # une seule fois : relie le projet (projectId dans app.json)
npx eas-cli@latest update:configure                        # une seule fois : active les mises à jour (updates.url)
npx eas-cli@latest build -p android --profile preview      # construit l'APK (lien à ouvrir sur le téléphone)
```

Ensuite, une modification du code JavaScript n'a pas besoin d'un nouvel APK : elle s'envoie par EAS Update.

```
npx eas-cli@latest update --channel preview --environment preview --message "ce qui change"
```

L'app télécharge la mise à jour au démarrage et l'applique au démarrage suivant. Un nouvel APK n'est nécessaire
qu'après l'ajout d'un module natif ou un changement de `version` dans `app.json`.

Les choix techniques importants sont expliqués dans [docs/adr](docs/adr/README.md).
