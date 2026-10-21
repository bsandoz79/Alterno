import { Switch, type SwitchProps } from 'react-native';

import { COLORS } from '@/shared/theme/colors';

/** Propriétés de l'interrupteur : sa valeur, son action et son nom pour les lecteurs d'écran. */
interface BrandSwitchProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
}

/**
 * Option propre au web (react-native-web) : la couleur du rond activé. Sans elle, le web ignore
 * `thumbColor` une fois l'interrupteur activé et affiche sa couleur par défaut (bleu-vert).
 * Les types de React Native ne la connaissent pas : elle passe par cet objet, ignoré sur Android.
 */
const WEB_ACTIVE_THUMB: Partial<SwitchProps> & { readonly activeThumbColor: string } = {
  activeThumbColor: COLORS.primary,
};

/**
 * Interrupteur aux couleurs de la charte (rond rouge, piste rose clair une fois activé),
 * identique sur Android et sur le web.
 *
 * @param props - Valeur, action et nom accessible
 * @returns L'interrupteur
 */
export function BrandSwitch({ value, onValueChange, accessibilityLabel }: BrandSwitchProps) {
  return (
    <Switch
      {...WEB_ACTIVE_THUMB}
      accessibilityLabel={accessibilityLabel}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.border, true: COLORS.primarySoft }}
      thumbColor={value ? COLORS.primary : COLORS.surface}
    />
  );
}
