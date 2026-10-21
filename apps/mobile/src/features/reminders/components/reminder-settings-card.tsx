import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandSwitch } from '@/shared/components/brand-switch';
import { InfoTip } from '@/shared/components/info-tip';
import { MessageBox } from '@/shared/components/message-box';
import { SegmentedControl } from '@/shared/components/segmented-control';
import { notificationsSupported } from '@/shared/notifications/create-notifier';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { useReminderSettings } from '../hooks/use-reminder-settings';
import {
  APPROVAL_FIRST_DELAY_OPTIONS,
  APPROVAL_REPEAT_OPTIONS,
  REMINDER_OPTIONS,
} from '../reminder-options';

/**
 * Carte « Notifications » : délai du rappel avant le départ, question à l'heure de départ
 * (« tu pars plus tard ? »), question de fin de semaine (« ta semaine s'est passée comme prévu ? »)
 * et suivi de la demande de récup (« ta récup a-t-elle été acceptée ? », avec ses délais).
 * On règle, puis on valide ; un message confirme ce qui a été programmé (ou pourquoi rien ne s'affichera).
 *
 * @returns La carte, une fois le réglage chargé
 */
export function ReminderSettingsCard() {
  const { draft, change, changed, validate, message } = useReminderSettings();
  if (draft === null) {
    return null;
  }
  return (
    <View style={styles.card}>
      <InfoTip
        title="Notifications"
        info={
          notificationsSupported()
            ? 'Pour chaque jour du plan. Les questions s’affichent avec leurs boutons : il suffit d’y répondre depuis la notification.'
            : 'Les notifications s’affichent dans l’application installée sur Android (APK), pas dans Expo Go ni dans le navigateur.'
        }
        titleStyle={styles.title}
      />
      <Text style={styles.label}>Rappel avant le départ</Text>
      <SegmentedControl
        accessibilityLabel="Rappel avant le départ"
        onSurface
        options={REMINDER_OPTIONS}
        selected={draft.lead}
        onChange={(lead) => {
          change({ lead });
        }}
      />
      <SettingSwitch
        label="Question au départ"
        info="À l’heure de départ prévue, te demande si tu pars plus tard ; la toucher ouvre « Parti plus tard »."
        accessibilityLabel="Question à l’heure de départ"
        value={draft.atDeparture}
        onChange={(atDeparture) => {
          change({ atDeparture });
        }}
      />
      <SettingSwitch
        label="Bilan de la semaine"
        info="1h après le dernier départ de la semaine : « Ta semaine s’est passée comme prévu ? », avec Oui ou Corriger."
        accessibilityLabel="Question de fin de semaine"
        value={draft.weekCheck}
        onChange={(weekCheck) => {
          change({ weekCheck });
        }}
      />
      <SettingSwitch
        label="Suivi de la récup"
        info="Après une demande de récup, te demande si elle a été acceptée (Oui, Non, Pas encore), puis relance sans réponse."
        accessibilityLabel="Suivi de la demande de récup"
        value={draft.approvalCheck}
        onChange={(approvalCheck) => {
          change({ approvalCheck });
        }}
      />
      {draft.approvalCheck ? (
        <>
          <Text style={styles.label}>Première question après</Text>
          <SegmentedControl
            accessibilityLabel="Première question de suivi après"
            onSurface
            options={APPROVAL_FIRST_DELAY_OPTIONS}
            selected={draft.approvalFirstDelayDays}
            onChange={(approvalFirstDelayDays) => {
              change({ approvalFirstDelayDays });
            }}
          />
          <Text style={styles.label}>Sans réponse, redemander</Text>
          <SegmentedControl
            accessibilityLabel="Relance du suivi"
            onSurface
            options={APPROVAL_REPEAT_OPTIONS}
            selected={draft.approvalRepeatDays}
            onChange={(approvalRepeatDays) => {
              change({ approvalRepeatDays });
            }}
          />
        </>
      ) : null}
      <Pressable
        style={[styles.button, !changed && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !changed }}
        disabled={!changed}
        onPress={() => void validate()}
      >
        <Text style={styles.buttonLabel}>Valider</Text>
      </Pressable>
      {message === null ? null : <MessageBox message={message} />}
    </View>
  );
}

/** Interrupteur d'un réglage, avec son libellé à gauche. */
function SettingSwitch({
  label,
  info,
  accessibilityLabel,
  value,
  onChange,
}: {
  readonly label: string;
  /** Ce que fait le réglage, affiché à la demande. */
  readonly info: string;
  readonly accessibilityLabel: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <InfoTip title={label} info={info} titleStyle={styles.switchLabel} />
      </View>
      <BrandSwitch accessibilityLabel={accessibilityLabel} value={value} onValueChange={onChange} />
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
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.surface,
  },
});
