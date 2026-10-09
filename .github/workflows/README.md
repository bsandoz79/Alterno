# Workflows GitHub Actions

| Fichier | Déclencheur | Rôle |
| --- | --- | --- |
| `ci.yml` | PR vers `main`, push sur `main` | Formatage, lint, types, tests et contrôle d'architecture du moteur |

Le job `engine` est obligatoire dans la règle « Protection main » : une PR ne peut pas être mergée s'il échoue.
