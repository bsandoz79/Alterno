# Workflows GitHub Actions

| Fichier | Déclencheur | Rôle |
| --- | --- | --- |
| `ci.yml` | PR vers `main`, push sur `main` | Job `engine` : formatage, lint, types, tests et contrôle d'architecture du moteur. Job `eas-update` (push sur `main` seulement, après `engine`) : publie une mise à jour EAS sur le canal `preview` |

Le job `engine` est obligatoire dans la règle « Protection main » : une PR ne peut pas être mergée s'il échoue.

Le job `eas-update` a besoin du secret `EXPO_TOKEN` (jeton d'accès créé sur expo.dev, ajouté dans
Settings → Secrets and variables → Actions). Sans lui, le job échoue avec un message explicite.
