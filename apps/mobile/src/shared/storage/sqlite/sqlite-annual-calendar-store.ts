import type { CalendarDate } from '@alterno/engine';

import type {
  AnnualCalendarStore,
  AttachedCalendar,
  DocumentFiles,
  PickedDocument,
} from '../annual-calendar-store';
import type { SqlDatabase } from './sql-database';

/** Ligne de la table `annual_calendar`. */
interface AnnualCalendarRow {
  readonly name: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly added_on: string;
  readonly uri: string;
}

/** Extension du fichier copié, d'après son type (le nom d'origine peut ne pas en avoir). */
const EXTENSIONS: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Calendrier annuel sur Android : le fichier est copié dans le dossier de l'app,
 * ses informations (nom, type, taille, date, adresse) dans la table `annual_calendar`.
 */
export class SqliteAnnualCalendarStore implements AnnualCalendarStore {
  /**
   * @param db - Base SQLite migrée
   * @param files - Accès aux fichiers de l'app
   */
  constructor(
    private readonly db: SqlDatabase,
    private readonly files: DocumentFiles,
  ) {}

  /** @inheritdoc */
  async load(): Promise<AttachedCalendar | null> {
    const row = await this.db.getFirstAsync<AnnualCalendarRow>(
      'SELECT name, mime_type, size_bytes, added_on, uri FROM annual_calendar WHERE id = 1',
    );
    return row === null
      ? null
      : {
          name: row.name,
          mimeType: row.mime_type,
          size: row.size_bytes,
          addedOn: row.added_on,
          uri: row.uri,
        };
  }

  /** @inheritdoc */
  async attach(document: PickedDocument, today: CalendarDate): Promise<AttachedCalendar> {
    // L'ancien fichier est supprimé d'abord : le nouveau peut avoir une autre extension.
    await this.deleteFile();
    const extension = EXTENSIONS[document.mimeType] ?? 'bin';
    const uri = await this.files.copyIn(document.uri, `annual-calendar.${extension}`);
    const attached: AttachedCalendar = {
      name: document.name,
      mimeType: document.mimeType,
      size: document.size,
      addedOn: today.toIsoString(),
      uri,
    };
    await this.db.runAsync(
      `INSERT INTO annual_calendar (id, name, mime_type, size_bytes, added_on, uri)
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET name = excluded.name, mime_type = excluded.mime_type,
         size_bytes = excluded.size_bytes, added_on = excluded.added_on, uri = excluded.uri`,
      [attached.name, attached.mimeType, attached.size, attached.addedOn, attached.uri],
    );
    return attached;
  }

  /** @inheritdoc */
  async remove(): Promise<void> {
    await this.deleteFile();
    await this.db.runAsync('DELETE FROM annual_calendar');
  }

  /** Supprime le fichier du calendrier actuel, s'il y en a un. */
  private async deleteFile(): Promise<void> {
    const current = await this.load();
    if (current !== null) {
      this.files.delete(current.uri);
    }
  }
}
