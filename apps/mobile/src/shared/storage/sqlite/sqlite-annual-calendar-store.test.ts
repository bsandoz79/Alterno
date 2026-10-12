import { CalendarDate } from '@alterno/engine';
import { describe, expect, it } from 'vitest';

import type { PickedDocument } from '../annual-calendar-store';
import { createMemoryDocumentFiles } from '../testing/memory-document-files';
import { createNodeSqlDatabase } from '../testing/node-sql-database';
import { migrateDatabase } from './migrate-database';
import { SqliteAnnualCalendarStore } from './sqlite-annual-calendar-store';

const today = CalendarDate.fromIsoString('2026-10-12');
const pdf: PickedDocument = {
  uri: 'file:///cache/calendrier.pdf',
  name: 'calendrier.pdf',
  mimeType: 'application/pdf',
  size: 10_128,
};

const createStore = async () => {
  const db = createNodeSqlDatabase();
  await migrateDatabase(db);
  const files = createMemoryDocumentFiles();
  return { store: new SqliteAnnualCalendarStore(db, files), files };
};

describe('SqliteAnnualCalendarStore — fichier du calendrier sur le téléphone', () => {
  it('copie le fichier dans le dossier de l’app, avec l’extension de son type', async () => {
    const { store, files } = await createStore();
    const attached = await store.attach(pdf, today);

    expect(attached.uri).toBe('file:///documents/annual-calendar.pdf');
    expect([...files.files]).toEqual(['file:///documents/annual-calendar.pdf']);
  });

  it('supprime l’ancien fichier quand on en joint un autre', async () => {
    const { store, files } = await createStore();
    await store.attach(pdf, today);
    await store.attach({ ...pdf, name: 'photo', mimeType: 'image/jpeg' }, today);

    expect([...files.files]).toEqual(['file:///documents/annual-calendar.jpg']);
  });

  it('supprime le fichier avec le calendrier', async () => {
    const { store, files } = await createStore();
    await store.attach(pdf, today);
    await store.remove();

    expect(files.files.size).toBe(0);
  });

  it('garde une extension neutre pour un type inattendu', async () => {
    const { store } = await createStore();

    expect((await store.attach({ ...pdf, mimeType: 'text/plain' }, today)).uri).toBe(
      'file:///documents/annual-calendar.bin',
    );
  });
});
