# CLAUDE.md — Alterno, planificateur d'horaires d'alternance (ALT)

Ce fichier définit les règles que Claude doit suivre à chaque demande sur ce repo.
Il prime sur les habitudes par défaut. En cas de doute, demander avant d'agir.

Cahier des charges complet : https://claude.ai/code/artifact/ff314fdd-542b-4f23-8d5e-217d1d776528

---

## 1. Le projet

App mobile (Android) + web qui planifie mes horaires variables d'alternant, recalcule quand je dévie du plan et affiche mon emploi du temps sur plusieurs semaines.

Objectifs, à égalité :
- **Solide** : code propre, testé, architecture claire.
- **Formateur** : je dois comprendre chaque choix (explique le pourquoi).
- **Utile au quotidien** : livrer vite une version utilisable, puis itérer.

Règle anti-dispersion : ne propose pas de nouvelle feature hors du jalon en cours. Si une idée surgit, note-la comme suggestion pour Plane, ne la code pas.

## 2. Stack et structure du monorepo

```
apps/
  mobile/        # React Native + Expo (mobile + web via React Native Web)
  api/           # Symfony + API Platform (architecture hexagonale)
packages/
  engine/        # Moteur métier TypeScript pur (règles, compteur, plans, alertes)
docs/
  adr/           # Architecture Decision Records
.github/
  workflows/     # CI/CD GitHub Actions
```

- `packages/engine` : **aucune dépendance** à React, Expo, SQLite, fetch ou une lib externe métier.
- Hébergement : web sur Vercel, API sur alwaysdata (gratuit), APK Android via EAS.
- Tout doit rester **gratuit**.

## 3. Architecture en couches (obligatoire)

Chaque brique suit : **domain → application → infrastructure → presentation**.

| Couche | Contient | Peut dépendre de |
| --- | --- | --- |
| domain | Entités, value objects, règles métier, interfaces (ports) | Rien |
| application | Cas d'usage (GeneratePlan, DeclareDeviation…) | domain |
| infrastructure | SQLite, API HTTP, notifications, horloge système | domain, application |
| presentation | Écrans, composants, contrôleurs, ressources API | application |

- Le domaine ne connaît **jamais** l'infrastructure.
- Les dépendances sont injectées (constructeur), jamais instanciées dans le domaine.
- Ces règles sont vérifiées en CI : dependency-cruiser (TS), Deptrac (PHP). Ne jamais les contourner.

Mobile : un dossier par feature (`features/simulation`, `features/deviations`, `features/calendar`, `features/settings`, `features/my-data`), chacun avec `screens/`, `components/`, `hooks/`, `adapters/`. Un composant n'appelle jamais SQLite ou l'API directement : il passe par un hook qui appelle un cas d'usage.

## 4. SOLID, concrètement

- **S** — Une classe / un fichier = une responsabilité. Ex. `LunchBreakRule`, `ComputeDayBalance`.
- **O** — Étendre sans modifier : les rythmes sont des stratégies (`FastPace`, `SteadyPace`, `LatePace` implémentent `PaceStrategy`).
- **L** — Toute implémentation d'une interface est interchangeable (toutes les `ScheduleRule` dans le validateur).
- **I** — Petites interfaces ciblées : `PlanRepository`, `DeviationRepository`, `CounterRepository`, `Notifier`, `Clock`, `ScheduleImporter`.
- **D** — Le domaine dépend d'abstractions ; l'infra fournit les implémentations.

Avant de coder, vérifie que la solution respecte ces 5 points. Si un compromis est nécessaire, explique-le.

## 5. Règles métier

- Les règles horaires (plages fixes/variables, 7h/jour, pause mini 45 min, vendredi) sont des **paramètres** (`WorkRules`), jamais en dur dans le code.
- Les durées et heures passent par des **value objects immuables** (`Duration`, `TimeOfDay`, `TimeSlot`). Pas de nombres magiques en minutes.
- L'heure courante passe toujours par l'interface `Clock` (testable à n'importe quelle date).
- Logique d'usage : le plan est considéré comme suivi ; l'utilisateur ne déclare que les écarts.

## 6. Conventions de code

- TypeScript `strict`, aucun `any`, pas de `!` non justifié. PHP : `declare(strict_types=1)`, types partout, PHPStan niveau max.
- Noms de code (variables, classes, fichiers) en **anglais** ; textes de l'interface en **français**.
- Fichiers courts, une exportation principale par fichier.
- Pas de code mort, pas de `console.log` / `dump()` laissés.

### Commentaires (obligatoires)

Les commentaires sont en **français** et expliquent le **pourquoi**, pas le quoi.

- Chaque classe, fonction et méthode publique a un bloc JSDoc / PHPDoc : rôle, paramètres, valeur de retour, exceptions.
- Chaque règle métier non évidente a un commentaire qui cite la règle (ex. « Le vendredi, la plage fixe de l'après-midi finit à 15h30 »).
- Pas de commentaire qui paraphrase le code (`// incrémente i`).

Exemple attendu :

```ts
/**
 * Calcule l'effet d'une journée sur le compteur d'heures.
 * Le système attend 7h par jour : le surplus alimente le compteur,
 * le manque y est puisé.
 *
 * @param worked - Temps réellement travaillé sur la journée
 * @param expected - Temps attendu (7h par défaut, issu de WorkRules)
 * @returns L'écart signé à ajouter au compteur
 */
export function computeDayBalance(worked: Duration, expected: Duration): Duration {
  return worked.minus(expected);
}
```

## 7. Tests

- **TDD sur le moteur** : écrire le test d'abord, puis le code minimal, puis refactorer.
- Chaque règle métier a au moins un test nominal et un test de cas limite (vendredi, pause > 45 min, journée max, objectif impossible).
- Nommage des tests en français et descriptif : `it("ajoute le surplus au compteur quand la journée dépasse 7h")`.
- Outils : Jest (engine, mobile), PHPUnit (api), Maestro (e2e mobile, plus tard).
- Ne jamais supprimer ou affaiblir un test pour faire passer la CI.

## 8. RGPD (dès la V1)

- Minimisation : ne stocker que le nécessaire.
- Toute nouvelle donnée personnelle doit être couverte par l'export et la suppression du compte (page « Mes données »).
- Aucun tracker ni analytics tiers.
- Tout envoi de fichier à un service externe (IA) exige un consentement explicite et révocable.
- Jamais de secret ni de donnée personnelle dans le code, les logs ou les commits.

## 9. Workflow Git : une feature = une branche = des commits = un push

1. Chaque tâche correspond à **un ticket Plane** (`ALT-<n>`). Si je ne donne pas l'ID, demande-le avant de commencer.
2. Créer la branche depuis `main` à jour :
   - `feature/ALT-12-compute-day-balance`
   - `fix/ALT-20-friday-afternoon`
   - `chore/ALT-3-ci-setup`
3. Commits **petits et atomiques**, au format Conventional Commits, avec l'ID du ticket :
   - `feat(engine): calcule l'écart journalier au compteur [ALT-12]`
   - `test(engine): couvre le cas du vendredi [ALT-12]`
   - `fix(mobile): corrige l'affichage de la pause [ALT-20]`
   - Types : `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`.
4. Après chaque commit cohérent : `git push` sur la branche.
5. À la fin de la feature : proposer le titre et la description de la PR en suivant `.github/pull_request_template.md`. Le titre de la PR suit le format Conventional Commits avec l'ID du ticket : on merge en **squash**, donc ce titre devient le commit sur `main`.
6. **Jamais** de commit ni de push sur `main` (protégée par une règle GitHub). Jamais de `--force` sur une branche partagée. Jamais `--no-verify`.
7. Après le merge, la branche distante est supprimée automatiquement ; revenir sur `main` et faire un pull.

Je travaille avec GitHub Desktop (branches, commits, push, PR) et VS Code + GitLens (historique, petits commits). Quand une action Git est à faire, indique-la aussi en clair (« dans GitHub Desktop : Current branch → New branch depuis main… ») pour que je puisse la faire moi-même si je préfère.

## 10. Plane : me dire quoi mettre à jour

Statuts du projet : Backlog → Todo → En cours → Test → Done (ou Cancelled). Les modules sont les jalons (Jalon 0 à Jalon 6) ; pas de cycles, j'avance à mon rythme.

À chaque étape clé, termine ta réponse par un bloc **« À faire dans Plane »** :

```
À faire dans Plane — ALT-12
- Statut : Todo → En cours
- Commentaire : « Branche feature/ALT-12-compute-day-balance créée »
```

Moments où ce bloc est obligatoire :
- Début de tâche → statut **En cours**, commentaire avec le nom de la branche.
- PR ouverte → statut **Test**, commentaire avec le lien de la PR.
- PR mergée → statut **Done**, commentaire avec un résumé en une ligne.
- Un seul ticket « En cours » à la fois.
- Bug ou idée découverte en route → proposer un **nouveau ticket** (titre, module, description courte), sans le coder.

## 11. Format de fin de tâche

Chaque fin de tâche contient, dans cet ordre :
1. **Ce qui a été fait** (2-4 lignes).
2. **Ce que tu as appris / à retenir** : le concept clé utilisé (ex. « inversion de dépendance via l'interface Clock »).
3. **Comment vérifier** : commande de test ou manip à faire.
4. **À faire dans Plane**.
5. **Prochaine étape** proposée (une seule).

## 12. Interdits

- Ajouter une dépendance sans expliquer pourquoi et sans alternative envisagée.
- Mettre des règles métier dans les composants UI ou les contrôleurs.
- Coder hors du ticket en cours.
- Désactiver une règle de lint, de typage ou d'architecture.
- Inventer une API ou une option de lib : vérifier la doc, sinon le dire.

## 13. Commandes (à compléter au fil du projet)

```
# Moteur
cd packages/engine && npm test

# Mobile
cd apps/mobile && npx expo start

# API
cd apps/api && symfony serve
cd apps/api && php bin/phpunit
```
