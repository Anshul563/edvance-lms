import { useEvent } from "expo";
import { VideoView, type VideoPlayer } from "expo-video";
import { Pause, Play, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type MiniPlayerProps = {
  player: VideoPlayer;
  title: string;
  onExpand: () => void;
  onClose: () => void;
};

export function MiniPlayer({ player, title, onExpand, onClose }: MiniPlayerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          bottom: insets.bottom + Spacing.three,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Expand video, ${title}`}
        onPress={onExpand}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          playsInline
        />
      </Pressable>

      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          hitSlop={6}
          onPress={togglePlay}
          style={styles.iconButton}>
          {isPlaying ? (
            <Pause size={16} color={theme.text} fill={theme.text} />
          ) : (
            <Play size={16} color={theme.text} fill={theme.text} />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Expand video, ${title}`}
          onPress={onExpand}
          style={styles.titleZone}>
          <ThemedText type="small" numberOfLines={1}>
            {title}
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close mini player"
          hitSlop={6}
          onPress={onClose}
          style={styles.iconButton}>
          <X size={16} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    right: Spacing.three,
    width: 200,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  titleZone: {
    flex: 1,
    minWidth: 0,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
});
