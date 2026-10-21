import { SplashScreen } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAppFonts } from '@/shared/hooks/use-app-fonts';
import { useNotificationTaps } from '@/shared/notifications/hooks/use-notification-taps';
import { RepositoriesProvider } from '@/shared/storage/repositories-provider';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';

// L'écran de démarrage reste affiché tant que les polices ne sont pas prêtes,
// pour éviter un « saut » de police au premier affichage.
void SplashScreen.preventAutoHideAsync();

/**
 * Navigation principale : quatre onglets, comme sur les maquettes (charte L4),
 * à l'intérieur du fournisseur de données (base locale ouverte et migrée avant l'affichage).
 * Expo Router associe chaque fichier de `src/app/` à une route ; ce fichier définit leur navigateur.
 *
 * @returns La barre d'onglets et l'écran courant
 */
export default function RootLayout() {
  const fontsReady = useAppFonts();
  // Toucher une notification de départ ouvre l'écran qu'elle désigne (ex. « Parti plus tard »).
  useNotificationTaps();

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <RepositoriesProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          // Onglets en texte seul, comme sur la maquette : pas d'icône.
          tabBarIcon: () => null,
          tabBarIconStyle: { display: 'none' },
          tabBarLabelStyle: { fontFamily: FONTS.bold, fontSize: 14 },
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: 72,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Aujourd'hui" }} />
        <Tabs.Screen name="semaine" options={{ title: 'Semaine' }} />
        <Tabs.Screen name="simulation" options={{ title: 'Simulation' }} />
        <Tabs.Screen name="compteur" options={{ title: 'Compteur' }} />
        {/* Écrans secondaires : ouverts depuis un autre écran, sans onglet dédié. */}
        <Tabs.Screen name="reglages" options={{ href: null, title: 'Réglages' }} />
        <Tabs.Screen name="preferences" options={{ href: null, title: 'Préférences' }} />
        <Tabs.Screen name="ecole" options={{ href: null, title: 'Semaines d’école' }} />
        <Tabs.Screen
          name="calendrier-annuel"
          options={{ href: null, title: 'Calendrier annuel' }}
        />
        <Tabs.Screen name="jour/[date]" options={{ href: null, title: 'Détail du jour' }} />
        <Tabs.Screen name="recup" options={{ href: null, title: 'Ma récup' }} />
      </Tabs>
    </RepositoriesProvider>
  );
}
