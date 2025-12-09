import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardHeader, CardBody } from '../components/Card';

function SettingRow({ icon, label, value, onPress, colors }) {
  return (
    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        <Text style={[styles.settingValue, { color: colors.textTertiary }]}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme, toggleTheme } = useTheme();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'ml', label: 'മലയാളം' },
  ];

  const themeLabels = { dark: t('settings.dark'), light: t('settings.light'), system: t('settings.system') };

  const changeLanguage = () => {
    const currentIndex = languages.findIndex(l => l.code === i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex].code);
  };

  const currentLang = languages.find(l => l.code === i18n.language)?.label || 'English';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        <CardHeader title={t('settings.title')} />
        <CardBody style={styles.cardBody}>
          <SettingRow
            icon="moon"
            label={t('settings.theme')}
            value={themeLabels[theme] || theme}
            onPress={toggleTheme}
            colors={colors}
          />
          <SettingRow
            icon="language"
            label={t('settings.language')}
            value={currentLang}
            onPress={changeLanguage}
            colors={colors}
          />
        </CardBody>
      </Card>

      <Card style={styles.card}>
        <CardHeader title="About" />
        <CardBody>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>App</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>KMRL Train Planner</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Backend</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>FastAPI + SQLite</Text>
          </View>
        </CardBody>
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Kochi Metro Rail Limited
        </Text>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          SIH 2025
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, marginBottom: 0 },
  cardBody: { padding: 0 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: '500' },
  footer: { alignItems: 'center', padding: 32 },
  footerText: { fontSize: 12 },
});
