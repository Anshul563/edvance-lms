import { Image } from "expo-image";
import { ChevronLeft, MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ChannelNavBarProps = {
  onBack: () => void;
};

export function ChannelNavBar({ onBack }: ChannelNavBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ChevronLeft size={20} color={theme.text} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={10}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <MoreHorizontal size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}

type ChannelBannerProps = {
  uri: string;
  accent: string;
};

export function ChannelBanner({ uri, accent }: ChannelBannerProps) {
  return (
    <View style={[styles.banner, { backgroundColor: accent }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
    </View>
  );
}

type ChannelIdentityProps = {
  name: string;
  handle: string;
  title: string;
  accent: string;
  avatarUrl: string;
  followers: string;
};

export function ChannelIdentity({
  name,
  handle,
  title,
  accent,
  avatarUrl,
  followers,
}: ChannelIdentityProps) {
  const theme = useTheme();

  return (
    <View style={styles.identity}>
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, { borderColor: theme.background, backgroundColor: accent }]}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.identityText}>
        <ThemedText type="heading" numberOfLines={1}>
          {name}
        </ThemedText>
        <View style={styles.subtitleRow}>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.handle}>
            {handle}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            · {followers} subscribers
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  button: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  banner: {
    height: 132,
    marginHorizontal: Spacing.three,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: Radius.pill,
    borderWidth: 3,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  handle: {
    flexShrink: 1,
  },
});
