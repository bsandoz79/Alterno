/**
 * Port d'effacement de toutes les données personnelles enregistrées par l'app (RGPD : droit à l'effacement).
 * Chaque stockage (SQLite sur Android, navigateur sur le web) fournit le sien : lui seul sait où sont ses données.
 */
export interface PersonalDataEraser {
  /** Efface toutes les données enregistrées : l'app repart comme au premier lancement. */
  eraseAll(): Promise<void>;
}
