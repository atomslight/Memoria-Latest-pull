import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';
import { usePreferencesStore } from '../../stores/preferencesStore';

type PlaceType = 'home' | 'work';

interface PlaceRowProps {
  type: PlaceType;
  icon: string;
  label: string;
  address: string | null;
  onSave: (address: string) => void;
}

function PlaceRow({ type, icon, label, address, onSave }: PlaceRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(address ?? '');

  const handleDone = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        if (!editing) {
          setDraft(address ?? '');
          setEditing(true);
        }
      }}
      activeOpacity={editing ? 1 : 0.7}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {editing ? (
          <TextInput
            style={styles.addressInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Enter address"
            placeholderTextColor={COLORS.inputPlaceholder}
            selectionColor={COLORS.brandYellow}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleDone}
          />
        ) : (
          <Text style={[styles.addressText, !address && styles.addressNotSet]}>
            {address || 'Not set'}
          </Text>
        )}
      </View>

      {editing && (
        <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function SmartPlacesScreen() {
  const navigation = useNavigation<any>();
  const { smartPlaces, setSmartPlace } = usePreferencesStore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Places</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.list}>
        <PlaceRow
          type="home"
          icon="home-outline"
          label="Home"
          address={smartPlaces.home}
          onSave={(addr) => setSmartPlace('home', addr || null)}
        />
        <PlaceRow
          type="work"
          icon="business-outline"
          label="Work"
          address={smartPlaces.work}
          onSave={(addr) => setSmartPlace('work', addr || null)}
        />
      </View>
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
    gap: SPACING.sm,
  },
  rowIcon: {
    width: 32,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
  },
  addressText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  addressNotSet: {
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  addressInput: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandYellow,
  },
  doneButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  doneText: {
    ...TYPOGRAPHY.button,
    color: COLORS.brandYellow,
    fontSize: 14,
  },
});
