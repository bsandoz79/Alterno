# 0008 — Rappels de départ : notifications locales, reprogrammées par décorateur

- Statut : acceptée
- Date : 2026-10-13 (ALT-29)

## Contexte

Le cahier des charges prévoit un rappel avant l'heure de départ prévue. Le plan change souvent
(plan validé, jour modifié) : les rappels programmés doivent toujours correspondre au plan en cours.

## Décision

- Le moteur calcule les rappels (`DepartureReminderPlanner`) et les confie à un port `Notifier`.
  Le cas d'usage `ScheduleDepartureReminders` **remplace tous** les rappels de départ à chaque fois,
  plutôt que de les modifier un par un : aucun rappel d'un ancien plan ne peut rester.
- L'horloge (`Clock`) donne aussi l'heure (`currentTime`) : seuls les rappels encore à venir sont programmés.
- Android : `expo-notifications`, notifications **locales** (calculées sur le téléphone, pas de serveur).
  Canal « Rappels de départ », permission demandée à la première programmation.
- **Expo Go** : depuis le SDK 53, le simple chargement d'expo-notifications lève une erreur sur Android
  (enregistrement automatique du jeton push). Le module est donc chargé par import dynamique
  (`DeferredNotifier`) et seulement hors d'Expo Go ; dans Expo Go, un notificateur silencieux le remplace.
  Les rappels se testent dans l'application installée (APK, ALT-38) ou un build de développement.
- Reprogrammation : le dépôt du plan est **décoré** (`ReschedulingPlanRepository`) ; s'y ajoute un
  rafraîchissement au retour au premier plan. Les écrans qui modifient le plan n'ont rien à appeler.
- Mise à jour ALT-47 : le réglage du rappel se **valide** (bouton, comme les autres écrans) via le cas
  d'usage `ChangeReminderSettings`, qui reprogramme et renvoie le résultat (`ReminderScheduling` :
  nombre de rappels, et `scheduled` / `not-allowed` / `unsupported`) pour l'afficher. Le décorateur
  du dépôt du réglage est supprimé : il ne pouvait pas remonter ce résultat à l'écran.
- Mise à jour ALT-48 : une seconde notification, **à l'heure de départ** (« tu pars plus tard ? »),
  activable dans le réglage (colonne `at_departure`, migration v9). Ses données contiennent l'adresse
  `/jour/<date>?change=late-departure` : la toucher ouvre directement la saisie « Parti plus tard »
  (écoute des notifications touchées, chargée elle aussi seulement hors d'Expo Go).
- Web : pas de notification (expo-notifications ne prend pas le web en charge) ; le réglage est gardé.
- Réglage : aucun, 5, 15 ou 30 min (15 min par défaut), table `reminder_settings` (migration v8).

## Alternatives envisagées

- Notifications push via un serveur : inutile pour un rappel calculable sur le téléphone, et payant/complexe.
- Appeler la reprogrammation depuis chaque écran qui modifie le plan : facile à oublier sur un nouvel écran.
- Permission d'alarme exacte (`SCHEDULE_EXACT_ALARM`) : non ajoutée ; sans elle, Android peut décaler
  un rappel de quelques minutes, acceptable pour un rappel de 15 min.

## Conséquences

- Une dépendance Expo officielle et gratuite (`expo-notifications`).
- Le réglage est une donnée personnelle de plus, à couvrir par l'export et la suppression (ALT-35).
