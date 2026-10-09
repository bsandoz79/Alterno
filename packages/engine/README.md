# Engine

Moteur métier d'Alterno, en TypeScript pur : règles horaires, calcul du compteur, génération des plans selon le rythme choisi, détection des écarts et alertes.

Règle d'or : **aucune dépendance** à React, Expo, une base de données ou au réseau. Tout ce qui touche l'extérieur passe par des interfaces (`Clock`, repositories…) implémentées ailleurs.

Initialisation prévue au jalon 1.
