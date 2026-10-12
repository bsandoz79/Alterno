const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

/**
 * Taille maximale d'un calendrier joint : 2 Mo.
 * Le calendrier EPSI fait une dizaine de Ko ; la limite sert surtout la version web,
 * où le fichier est gardé dans le stockage du navigateur (environ 5 Mo pour toute l'app).
 */
export const MAX_ATTACHMENT_BYTES = 2 * BYTES_PER_MB;

/** Formats acceptés : un PDF, ou une photo / capture du calendrier. */
const ACCEPTED_TYPES: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Ce qu'on sait d'un fichier choisi avant de l'enregistrer. */
export interface AttachmentCandidate {
  readonly mimeType: string;
  /** Taille en octets. */
  readonly size: number;
}

/**
 * Vérifie qu'un fichier peut être joint comme calendrier annuel.
 *
 * @param candidate - Type et taille du fichier choisi
 * @returns `null` s'il est accepté, sinon le message à afficher
 */
export function checkAttachment(candidate: AttachmentCandidate): string | null {
  if (!ACCEPTED_TYPES.includes(candidate.mimeType)) {
    return 'Format non pris en charge : choisis un PDF ou une image (JPEG, PNG, WebP).';
  }
  if (candidate.size > MAX_ATTACHMENT_BYTES) {
    return `Fichier trop lourd (${formatFileSize(MAX_ATTACHMENT_BYTES)} maximum) : celui-ci fait ${formatFileSize(candidate.size)}.`;
  }
  return null;
}

/**
 * Taille lisible en français, ex. « 9,9 Ko » ou « 3,0 Mo ».
 *
 * @param bytes - Taille en octets
 * @returns La taille arrondie à une décimale
 */
export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_KB) {
    return `${String(bytes)} o`;
  }
  const [value, unit] =
    bytes < BYTES_PER_MB ? [bytes / BYTES_PER_KB, 'Ko'] : [bytes / BYTES_PER_MB, 'Mo'];
  return `${value.toFixed(1).replace('.', ',')} ${unit}`;
}
