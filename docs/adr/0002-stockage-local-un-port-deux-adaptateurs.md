# 0002 — Stockage local : un port, deux adaptateurs

- Statut : acceptée
- Date : 2026-10-10 (ALT-17)

## Contexte

L'app tourne sur Android et sur le web (React Native Web), sans serveur en V1.
`expo-sqlite` n'est qu'en alpha sur le web.

## Décision

Chaque donnée a un port (interface) : `PlanRepository`, `CounterRepository`, `WorkRulesSettingsRepository`,
`PlanningPreferencesRepository`, `SchoolWeeksRepository` dans le moteur, `AnnualCalendarStore` dans l'app.
Deux implémentations par port :

- **Android** : SQLite (`expo-sqlite`), dans `shared/storage/sqlite/` ;
- **web** : stockage du navigateur (`localStorage`, en JSON), dans `shared/storage/browser/`.

Metro choisit le bon fournisseur grâce aux fichiers par plateforme
(`repositories-provider.tsx` / `repositories-provider.web.tsx`).
Un **test de contrat** (`repositories.contract.test.ts`) joue exactement les mêmes scénarios sur les deux.

## Alternatives envisagées

- **SQLite partout** (y compris web via WebAssembly) : alpha, instable.
- **localStorage partout** : non adapté au téléphone, aucune requête possible.

## Conséquences

- Les écrans et les cas d'usage ignorent la plateforme : inversion de dépendance (le « D » de SOLID).
- Chaque nouvelle donnée demande deux adaptateurs et un ajout au test de contrat, plus une ligne
  dans la liste RGPD (ALT-35).
- Version web provisoire : au jalon 4, elle passera par l'API.
