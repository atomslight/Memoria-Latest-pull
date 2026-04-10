import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';
import { usePreferencesStore, Language } from '../../stores/preferencesStore';

interface LanguageOption {
  code: Language;
  label: string;
  selectable: true;
}

interface ComingSoonOption {
  code: string;
  label: string;
  selectable: false;
}

type LanguageItem = LanguageOption | ComingSoonOption;

const LANGUAGES: LanguageItem[] = [
  { code: 'english', label: 'English', selectable: true },
  { code: 'hinglish', label: 'Hinglish', selectable: true },
  { code: 'hindi', label: 'Hindi', selectable: false },
  { code: 'spanish', label: 'Spanish', selectable: false },
  { code: 'french', label: 'French', selectable: false },
  { code: 'japanese', label: 'Japanese', selectable: false },
];

export default function LanguageScreen() {
  const navigation = useNavigation<any>();
  const { language, setLanguage } = usePreferencesStore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {LANGUAGES.map((item) => {
          const isActive = item.selectable && item.code === language;

          return (
            <TouchableOpacity
              key={item.code}
              style={styles.row}
              onPress={() => {
                if (item.selectable) {
                  setLanguage(item.code as Language);
                }
              }}
              disabled={!item.selectable}
              activeOpacity={item.selectable ? 0.7 : 1}
            >
              <Text style={[styles.rowLabel, !item.selectable && styles.rowLabelDisabled]}>
                {item.label}
              </Text>

              {!item.selectable && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}

              {isActive && (
                <Ionicons name="checkmark" size={20} color={COLORS.brandYellow} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  rowLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rowLabelDisabled: {
    color: COLORS.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginRight: SPACING.xs,
  },
  comingSoonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
});
