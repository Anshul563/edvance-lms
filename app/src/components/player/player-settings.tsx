import { X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { QUALITY_OPTIONS } from "@/data/courses";
import type { Quality } from "@/types/course";

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

type PlayerSettingsProps = {
  rate: number;
  onRateChange: (rate: number) => void;
  quality: Quality;
  onQualityChange: (quality: Quality) => void;
  autoplay: boolean;
  onAutoplayChange: (value: boolean) => void;
  canAutoplay: boolean;
  ambient: boolean;
  onAmbientChange: (value: boolean) => void;
  onClose: () => void;
};

export function PlayerSettings({
  rate,
  onRateChange,
  quality,
  onQualityChange,
  autoplay,
  onAutoplayChange,
  canAutoplay,
  ambient,
  onAmbientChange,
  onClose,
}: PlayerSettingsProps) {
  return (
    <View style={styles.backdrop}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close playback settings"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />

      <View style={styles.sheet}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.headerText}>
            Playback settings
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close playback settings"
            hitSlop={10}
            onPress={onClose}
            style={styles.closeButton}>
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.group}>
            <ThemedText type="label" style={styles.groupLabel}>
              Speed
            </ThemedText>
            <View style={styles.chips}>
              {PLAYBACK_RATES.map((option) => {
                const active = option === rate;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Speed ${option} times`}
                    onPress={() => onRateChange(option)}
                    style={[styles.chip, active ? styles.chipActive : null]}>
                    <ThemedText type="smallBold" style={active ? styles.chipTextActive : styles.chipText}>
                      {option}×
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <ThemedText type="label" style={styles.groupLabel}>
              Quality
            </ThemedText>
            <View style={styles.chips}>
              {QUALITY_OPTIONS.map((option) => {
                const active = option === quality;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={option === "auto" ? "Quality auto" : `Quality ${option}`}
                    onPress={() => onQualityChange(option)}
                    style={[styles.chip, active ? styles.chipActive : null]}>
                    <ThemedText type="smallBold" style={active ? styles.chipTextActive : styles.chipText}>
                      {option === "auto" ? "Auto" : option}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <View style={[styles.row, !canAutoplay ? styles.rowDisabled : null]}>
              <View style={styles.rowText}>
                <ThemedText type="small" style={styles.rowTitle}>
                  Autoplay next lesson
                </ThemedText>
                <ThemedText type="small" style={styles.rowHint}>
                  {canAutoplay ? "Play the next lesson automatically" : "This is the last lesson"}
                </ThemedText>
              </View>
              <Switch
                value={autoplay}
                onValueChange={onAutoplayChange}
                disabled={!canAutoplay}
                trackColor={{ false: "rgba(255,255,255,0.25)", true: "#FF0033" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.25)"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText type="small" style={styles.rowTitle}>
                  Ambient mode
                </ThemedText>
                <ThemedText type="small" style={styles.rowHint}>
                  Soft, moving glow around the video
                </ThemedText>
              </View>
              <Switch
                value={ambient}
                onValueChange={onAmbientChange}
                trackColor={{ false: "rgba(255,255,255,0.25)", true: "#FF0033" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.25)"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "100%",
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    backgroundColor: "rgba(24,24,24,0.98)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    color: "#FFFFFF",
  },
  closeButton: {
    padding: Spacing.one,
  },
  content: {
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  group: {
    gap: Spacing.two,
  },
  groupLabel: {
    color: "rgba(255,255,255,0.6)",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  chip: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  chipActive: {
    backgroundColor: "#FF0033",
  },
  chipText: {
    color: "#FFFFFF",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: "#FFFFFF",
  },
  rowHint: {
    color: "rgba(255,255,255,0.6)",
  },
});
