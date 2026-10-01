import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  PictureInPicture2,
  Repeat,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";
import { useState } from "react";
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
  canPictureInPicture: boolean;
  onPictureInPicture: () => void;
  onClose: () => void;
};

type SettingsPage = "main" | "quality" | "speed";

function qualityLabel(quality: Quality): string {
  return quality === "auto" ? "Auto" : quality;
}

function speedLabel(rate: number): string {
  return rate === 1 ? "Normal" : `${rate}×`;
}

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
  canPictureInPicture,
  onPictureInPicture,
  onClose,
}: PlayerSettingsProps) {
  const [page, setPage] = useState<SettingsPage>("main");

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
          {page === "main" ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to settings"
              hitSlop={10}
              onPress={() => setPage("main")}
              style={styles.backButton}>
              <ChevronLeft size={20} color="#FFFFFF" />
            </Pressable>
          )}
          <ThemedText type="smallBold" style={styles.headerText}>
            {page === "main"
              ? "Settings"
              : page === "quality"
                ? "Quality"
                : "Playback speed"}
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
          {page === "main" ? (
            <View style={styles.menu}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quality, currently ${qualityLabel(quality)}`}
                onPress={() => setPage("quality")}
                style={({ pressed }) => [
                  styles.menuRow,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <SlidersHorizontal size={18} color="#FFFFFF" />
                <ThemedText type="small" style={styles.menuLabel}>
                  Quality
                </ThemedText>
                <ThemedText type="small" style={styles.menuValue} numberOfLines={1}>
                  {qualityLabel(quality)}
                </ThemedText>
                <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Playback speed, currently ${speedLabel(rate)}`}
                onPress={() => setPage("speed")}
                style={({ pressed }) => [
                  styles.menuRow,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <Gauge size={18} color="#FFFFFF" />
                <ThemedText type="small" style={styles.menuLabel}>
                  Playback speed
                </ThemedText>
                <ThemedText type="small" style={styles.menuValue} numberOfLines={1}>
                  {speedLabel(rate)}
                </ThemedText>
                <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>

              <View style={[styles.menuRow, !canAutoplay ? styles.rowDisabled : null]}>
                <Repeat size={18} color="#FFFFFF" />
                <View style={styles.rowText}>
                  <ThemedText type="small" style={styles.rowTitle}>
                    Autoplay next
                  </ThemedText>
                  <ThemedText type="small" style={styles.rowHint}>
                    {canAutoplay ? "Up next plays automatically" : "This is the last video"}
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

              <View style={styles.menuRow}>
                <Sparkles size={18} color="#FFFFFF" />
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

              {canPictureInPicture ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Picture in picture"
                  onPress={onPictureInPicture}
                  style={({ pressed }) => [
                    styles.menuRow,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}>
                  <PictureInPicture2 size={18} color="#FFFFFF" />
                  <ThemedText type="small" style={styles.menuLabel}>
                    Picture in picture
                  </ThemedText>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>
          ) : page === "quality" ? (
            <View style={styles.menu}>
              {QUALITY_OPTIONS.map((option) => {
                const active = option === quality;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      option === "auto" ? "Quality auto" : `Quality ${option}`
                    }
                    onPress={() => {
                      onQualityChange(option);
                      setPage("main");
                    }}
                    style={({ pressed }) => [
                      styles.menuRow,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}>
                    <ThemedText type="small" style={styles.menuLabel}>
                      {option === "auto" ? "Auto" : option}
                    </ThemedText>
                    {active ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.menu}>
              {PLAYBACK_RATES.map((option) => {
                const active = option === rate;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Speed ${option} times`}
                    onPress={() => {
                      onRateChange(option);
                      setPage("main");
                    }}
                    style={({ pressed }) => [
                      styles.menuRow,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}>
                    <ThemedText type="small" style={styles.menuLabel}>
                      {option === 1 ? "Normal" : `${option}×`}
                    </ThemedText>
                    {active ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
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
    maxHeight: "70%",
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    backgroundColor: "rgba(24,24,24,0.98)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.one,
  },
  headerText: {
    flex: 1,
    color: "#FFFFFF",
  },
  backButton: {
    padding: Spacing.one,
    marginRight: Spacing.one,
  },
  closeButton: {
    padding: Spacing.one,
  },
  content: {
    paddingTop: Spacing.one,
  },
  menu: {
    gap: Spacing.one,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
  },
  menuLabel: {
    flex: 1,
    color: "#FFFFFF",
  },
  menuValue: {
    color: "rgba(255,255,255,0.6)",
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
