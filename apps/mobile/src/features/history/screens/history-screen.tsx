import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InfoTip } from '@/shared/components/info-tip';
import { MessageBox } from '@/shared/components/message-box';
import { ScreenContainer } from '@/shared/components/screen-container';
import { TimeField } from '@/shared/components/time-field';
import { COLORS } from '@/shared/theme/colors';
import { FONTS } from '@/shared/theme/fonts';
import { RADIUS, SPACING } from '@/shared/theme/spacing';

import { BalanceChart } from '../components/balance-chart';
import { MonthCard } from '../components/month-card';
import { formatContractStart } from '../contract-start-form';
import { useHistory } from '../hooks/use-history';
import { recoveryLabel } from '../history-view';

/**
 * Écran « Historique » (depuis Compteur) : le total depuis le début du contrat, l'évolution du solde
 * mois par mois, puis chaque mois (le plus récent en premier) avec son détail jour par jour.
 *
 * @returns L'écran
 */
export function HistoryScreen() {
  const { history, saveContractStart, message } = useHistory();
  const [startInput, setStartInput] = useState<string | null>(null);

  if (history === null) {
    return <ScreenContainer title="Historique" overline="Compteur" />;
  }
  const { summary, contractStart } = history;
  const { total } = summary;
  const shownStart =
    startInput ?? (contractStart === null ? '' : formatContractStart(contractStart));

  return (
    <ScreenContainer title="Historique" overline="Compteur">
      <Link href="/compteur" style={styles.back}>
        ‹ Retour au compteur
      </Link>

      <View style={styles.card}>
        <InfoTip
          title={contractStart === null ? 'Depuis le début' : 'Depuis le début du contrat'}
          info="Calculé à partir des journées gardées par Alterno (plan suivi, écarts déclarés). Le compteur, lui, suit Smart RH : il peut différer."
          titleStyle={styles.cardTitle}
        />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Heures faites</Text>
          <Text style={styles.totalValue}>{total.worked.format()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Heures attendues</Text>
          <Text style={styles.totalValue}>{total.expected.format()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Écart cumulé</Text>
          <Text
            style={[
              styles.totalValue,
              total.balance.isNegative() ? styles.negative : styles.positive,
            ]}
          >
            {total.balance.format({ signed: true })}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Récups prises</Text>
          <Text style={styles.totalValue}>{recoveryLabel(total.recoveryDays)}</Text>
        </View>
        <TimeField
          label="Début du contrat"
          value={shownStart}
          placeholder="JJ/MM/AAAA"
          onChange={setStartInput}
          wide
        />
        {startInput === null ? null : (
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            onPress={() => {
              void saveContractStart(startInput).then(() => {
                setStartInput(null);
              });
            }}
          >
            <Text style={styles.buttonLabel}>Enregistrer la date</Text>
          </Pressable>
        )}
        {message === null ? null : <MessageBox message={message} />}
      </View>

      {summary.months.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>
            Rien encore : les journées passées s’ajoutent ici au fil des jours.
          </Text>
        </View>
      ) : (
        <>
          <BalanceChart months={summary.months} />
          {[...summary.months].reverse().map((month) => (
            <MonthCard
              key={`${String(month.month.year)}-${String(month.month.month)}`}
              month={month}
            />
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  totalValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.text,
  },
  positive: {
    color: COLORS.positive,
  },
  negative: {
    color: COLORS.primary,
  },
  button: {
    minHeight: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    color: COLORS.surface,
  },
  empty: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
  },
});
