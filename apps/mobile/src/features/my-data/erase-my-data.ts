import type { Repositories } from '@/shared/storage/repositories';

/** Ce qu'il faut pour tout effacer : le calendrier joint (et son fichier), le stockage et les notifications. */
export type EraseTargets = Pick<Repositories, 'annualCalendar' | 'eraser' | 'notifier'>;

/**
 * Efface toutes les données (RGPD : droit à l'effacement) : le fichier du calendrier joint,
 * puis tout le stockage, puis les notifications déjà programmées sur le téléphone.
 *
 * @param targets - Calendrier joint, effacement du stockage et notifications
 */
export async function eraseMyData(targets: EraseTargets): Promise<void> {
  // Le fichier d'abord : une fois la ligne effacée, on ne saurait plus où il est.
  await targets.annualCalendar.remove();
  await targets.eraser.eraseAll();
  await targets.notifier.replaceReminders([]);
}
