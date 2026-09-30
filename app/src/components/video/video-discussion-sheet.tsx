import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { VideoDiscussionSection } from "@/components/video/video-discussion";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type VideoDiscussionSheetProps = {
  visible: boolean;
  topOffset: number;
  onClose: () => void;
  videoId: string;
  totalCount: number;
};

export function VideoDiscussionSheet({
  visible,
  topOffset,
  onClose,
  videoId,
  totalCount,
}: VideoDiscussionSheetProps) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityViewIsModal={visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}>
      <Animated.View
        style={[
          styles.sheet,
          {
            top: topOffset,
            backgroundColor: theme.background,
            borderColor: theme.border,
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.grabberWrap}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close discussion"
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <X size={16} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <VideoDiscussionSection videoId={videoId} totalCount={totalCount} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
  },
  close: {
    position: "absolute",
    right: Spacing.three,
    top: Spacing.two,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  content: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
});