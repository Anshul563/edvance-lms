import { CalendarDays, Clock, Eye, ThumbsUp, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatCount, formatSeconds } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";

import type { Channel, StandaloneVideo } from "@/types/instructor";

type VideoInfoSheetProps = {
  visible: boolean;
  topOffset: number;
  onClose: () => void;
  video: StandaloneVideo;
  channel: Channel;
  likes: number;
};

export function VideoInfoSheet({
  visible,
  topOffset,
  onClose,
  video,
  channel,
  likes,
}: VideoInfoSheetProps) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const [dragY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
    }
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [dragY, progress, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx * 1.5),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) dragY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.7) {
            onClose();
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, onClose],
  );

  const enterTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityViewIsModal={visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: backdropOpacity, backgroundColor: "#000" }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close video details"
          onPress={onClose}
          style={styles.backdrop}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            top: topOffset,
            backgroundColor: theme.background,
            borderColor: theme.border,
            opacity: progress,
            transform: [{ translateY: Animated.add(enterTranslate, dragY) }],
          },
        ]}>
        <View {...panResponder.panHandlers} style={styles.grabberWrap}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        </View>
        <View style={styles.headerRow}>
          <View {...panResponder.panHandlers} style={styles.titleZone}>
            <ThemedText type="subtitle">Description</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <X size={16} color={theme.text} />
          </Pressable>
        </View>
        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <ThemedText type="heading">{video.title}</ThemedText>

          <View style={[styles.panel, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.statRow}>
              <ThumbsUp size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                Likes
              </ThemedText>
              <ThemedText type="smallBold" style={styles.statValue}>
                {formatCount(likes)}
              </ThemedText>
            </View>

            <View style={styles.statRow}>
              <Eye size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                Views
              </ThemedText>
              <ThemedText type="smallBold" style={styles.statValue}>
                {formatCount(video.views)}
              </ThemedText>
            </View>

            <View style={styles.statRow}>
              <CalendarDays size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                Uploaded
              </ThemedText>
              <ThemedText type="smallBold" style={styles.statValue}>
                {video.publishedAt}
              </ThemedText>
            </View>

            <View style={styles.statRow}>
              <Clock size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                Duration
              </ThemedText>
              <ThemedText type="smallBold" style={styles.statValue}>
                {formatSeconds(video.durationSeconds)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.channelRow}>
            <View style={[styles.avatar, { backgroundColor: channel.accent }]}>
              <ThemedText type="label" style={styles.avatarText}>
                {channel.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.channelText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {channel.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {channel.handle}
              </ThemedText>
            </View>
          </View>

          <View style={styles.descriptionBlock}>
            <ThemedText type="small" style={styles.descriptionText}>
              {video.description}
            </ThemedText>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  grabberWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    paddingHorizontal: Spacing.five,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingBottom: Spacing.two,
  },
  titleZone: {
    flex: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingRight: Spacing.two,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.8,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    textAlign: "right",
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  avatarText: {
    color: "#FFFFFF",
  },
  channelText: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  descriptionBlock: {
    gap: Spacing.one,
  },
  descriptionText: {
    lineHeight: 21,
  },
});
