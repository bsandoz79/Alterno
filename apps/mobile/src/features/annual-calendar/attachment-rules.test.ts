import { describe, expect, it } from 'vitest';

import { checkAttachment, formatFileSize } from './attachment-rules';

describe('checkAttachment — fichier accepté comme calendrier annuel', () => {
  it.each([['application/pdf'], ['image/jpeg'], ['image/png'], ['image/webp']])(
    'accepte un %s',
    (mimeType) => {
      expect(checkAttachment({ mimeType, size: 10_000 })).toBeNull();
    },
  );

  it('refuse un autre type de fichier', () => {
    expect(checkAttachment({ mimeType: 'application/zip', size: 10_000 })).toBe(
      'Format non pris en charge : choisis un PDF ou une image (JPEG, PNG, WebP).',
    );
  });

  it('accepte un fichier de 2 Mo pile, refuse au-delà', () => {
    expect(checkAttachment({ mimeType: 'application/pdf', size: 2 * 1024 * 1024 })).toBeNull();
    expect(
      checkAttachment({ mimeType: 'application/pdf', size: 2 * 1024 * 1024 + 1 }),
    ).not.toBeNull();
  });

  it('indique la taille maximale et celle du fichier refusé', () => {
    expect(checkAttachment({ mimeType: 'image/png', size: 3 * 1024 * 1024 })).toBe(
      'Fichier trop lourd (2,0 Mo maximum) : celui-ci fait 3,0 Mo.',
    );
  });
});

describe('formatFileSize — taille lisible', () => {
  it.each([
    [500, '500 o'],
    [10_128, '9,9 Ko'],
    [3 * 1024 * 1024, '3,0 Mo'],
  ])('%d octets → %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
