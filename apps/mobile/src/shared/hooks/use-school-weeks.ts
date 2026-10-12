import type { CalendarDate, SchoolWeeks } from '@alterno/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRepositories } from '@/shared/storage/repositories-context';

/** Semaines d'école et action de marquage. */
export interface SchoolWeeksState {
  /** `null` pendant le chargement. */
  readonly schoolWeeks: SchoolWeeks | null;
  /** Marque ou démarque la semaine de ce jour, et l'enregistre aussitôt. */
  readonly toggle: (anyDay: CalendarDate) => Promise<void>;
}

/**
 * Charge les semaines d'école à chaque affichage de l'écran (elles ont pu être marquées ailleurs).
 * Partagé : le planning les affiche, l'écran de marquage les modifie.
 *
 * @returns Les semaines d'école et l'action de marquage
 */
export function useSchoolWeeks(): SchoolWeeksState {
  const { schoolWeeks: repository } = useRepositories();
  const [schoolWeeks, setSchoolWeeks] = useState<SchoolWeeks | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.load().then((loaded) => {
        if (active) {
          setSchoolWeeks(loaded);
        }
      });
      return () => {
        active = false;
      };
    }, [repository]),
  );

  const toggle = useCallback(
    async (anyDay: CalendarDate) => {
      if (schoolWeeks === null) {
        return;
      }
      const next = schoolWeeks.toggle(anyDay);
      // Affiché tout de suite, enregistré ensuite : l'appui doit paraître instantané.
      setSchoolWeeks(next);
      await repository.save(next);
    },
    [schoolWeeks, repository],
  );

  return { schoolWeeks, toggle };
}
