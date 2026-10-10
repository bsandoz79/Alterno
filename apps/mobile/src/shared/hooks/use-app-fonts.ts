import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';

/**
 * Charge les graisses de Nunito utilisées par la charte.
 *
 * @returns `true` quand les polices sont prêtes (ou en échec : l'app s'affiche alors avec la police système
 *   plutôt que de rester bloquée sur l'écran de démarrage)
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  return loaded || error !== null;
}
