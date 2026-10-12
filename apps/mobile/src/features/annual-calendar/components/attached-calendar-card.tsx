import { CalendarDate } from '@alterno/engine';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLongDate } from '@/shared/format/format-date';
import type { AttachedCalendar } from '@/shared/storage/annual-calendar-store';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { formatFileSize } from '../attachment-rules';

/** Propriétés de la carte du calendrier joint. */
interface AttachedCalendarCardProps {
  readonly calendar: AttachedCalendar;
  readonly onOpen: () => void;
  readonly onReplace: () => void;
  readonly onRemove: () => void;
}

/**
 * Carte du calendrier joint : nom, format, taille et date d'ajout, aperçu si c'est une image,
 * et les actions Ouvrir / Remplacer / Supprimer. La suppression demande une confirmation
 * dans la carte elle-même (deuxième appui), sans boîte de dialogue système.
 *
 * @param props - Calendrier et actions
 * @returns La carte
 */
export function AttachedCalendarCard({
  calendar,
  onOpen,
  onReplace,
  onRemove,
}: AttachedCalendarCardProps) {
  const [confirming, setConfirming] = useState(false);
  const isImage = calendar.mimeType.startsWith('image/');
  const details = [
    isImage ? 'Image' : 'PDF',
    formatFileSize(calendar.size),
    `ajouté le ${formatLongDate(CalendarDate.fromIsoString(calendar.addedOn)).toLowerCase()}`,
  ].join(' · ');

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{calendar.name}</Text>
      <Text style={styles.details}>{details}</Text>
      {isImage ? (
        <Image
          source={{ uri: calendar.uri }}
          style={styles.preview}
          resizeMode="contain"
          accessibilityLabel="Aperçu du calendrier annuel"
        />
      ) : null}
      <Pressable style={styles.primaryButton} accessibilityRole="button" onPress={onOpen}>
        <Text style={styles.primaryLabel}>Ouvrir</Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={onReplace}>
          <Text style={styles.secondaryLabel}>Remplacer</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          onPress={() => {
            if (confirming) {
              onRemove();
            }
            setConfirming(!confirming);
          }}
        >
          <Text style={styles.secondaryLabel}>
            {confirming ? 'Confirmer la suppression' : 'Supprimer'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  name: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  details: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  preview: {
    width: '100%',
    height: 320,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryButton: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
