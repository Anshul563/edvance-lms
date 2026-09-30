import { Bell } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { EdvanceLogo } from "@/components/edvance-logo";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { PROFILE, getInitials } from "@/data/profile";
import { useTheme } from "@/hooks/use-theme";

type AppBarProps = {
  onPressNotifications?: () => void;
  hasUnread?: boolean;
};

const MARK_SIZE = 32;

export function AppBar({
  onPressNotifications,
  hasUnread = false,
}: AppBarProps) {
  const theme = useTheme();
  const initials = getInitials(PROFILE.firstName, PROFILE.lastName);

  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <EdvanceLogo size={MARK_SIZE - 6} />
        </View>
        <ThemedText type="title" numberOfLines={1} style={styles.wordmark}>
          Edvance
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasUnread ? "Notifications, unread" : "Notifications"
          }
          onPress={onPressNotifications}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton
          ]}
        >
          <Bell size={19} color={theme.text} />
          {hasUnread ? (
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: theme.brand,
                  borderColor: theme.backgroundElement,
                },
              ]}
            />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Your profile, ${PROFILE.firstName} ${PROFILE.lastName}`}
          onPress={() => router.push("/profile")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.avatar,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View
            style={[styles.avatarCircle, { backgroundColor: theme.brandMuted }]}
          >
            <ThemedText type="smallBold" themeColor="brand">
              {initials}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flexShrink: 1,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: Radius.small,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 7,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  avatar: {
    borderRadius: Radius.pill,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
