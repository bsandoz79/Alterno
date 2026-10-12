import type { CalendarDate } from '@alterno/engine';

/** Fichier choisi par l'utilisateur, tel que le sélecteur de fichiers le fournit. */
export interface PickedDocument {
  /** Adresse temporaire du fichier choisi (cache de l'app sur Android). */
  readonly uri: string;
  readonly name: string;
  readonly mimeType: string;
  /** Taille en octets. */
  readonly size: number;
  /** Contenu en « data URL » (web uniquement : le navigateur ne garde pas de fichier sur le disque). */
  readonly dataUrl?: string;
}

/** Calendrier annuel joint, tel qu'enregistré dans l'app. */
export interface AttachedCalendar {
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  /** Date d'ajout, au format AAAA-MM-JJ. */
  readonly addedOn: string;
  /** Adresse où lire le fichier : fichier de l'app sur Android, « data URL » sur le web. */
  readonly uri: string;
}

/**
 * Stockage du calendrier annuel d'alternance (un seul fichier à la fois, facultatif).
 * C'est un fichier, pas une règle métier : le port vit dans l'app, pas dans le moteur.
 */
export interface AnnualCalendarStore {
  /** @returns Le calendrier joint, ou `null` s'il n'y en a pas */
  load(): Promise<AttachedCalendar | null>;

  /**
   * Joint un fichier ; il remplace le calendrier précédent.
   *
   * @param document - Fichier choisi (déjà vérifié : type et taille)
   * @param today - Date d'ajout
   * @returns Le calendrier enregistré
   */
  attach(document: PickedDocument, today: CalendarDate): Promise<AttachedCalendar>;

  /** Supprime le calendrier joint et son fichier. */
  remove(): Promise<void>;
}

/**
 * Accès aux fichiers de l'app (Android) : copie d'un fichier choisi dans un dossier durable, suppression.
 * Séparé du dépôt pour le tester sans téléphone (une version en mémoire le remplace en test).
 */
export interface DocumentFiles {
  /**
   * @param sourceUri - Fichier à copier (cache du sélecteur, que le système peut vider)
   * @param fileName - Nom du fichier dans le dossier de l'app
   * @returns L'adresse de la copie
   */
  copyIn(sourceUri: string, fileName: string): Promise<string>;

  /** @param uri - Fichier à supprimer (sans erreur s'il n'existe plus) */
  delete(uri: string): void;
}
