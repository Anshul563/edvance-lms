import { Image } from "expo-image";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatCount, formatSeconds } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Recommendation } from "@/data/recommendations";

type RecommendationRowProps = {
  item: Recommendation;
  onPress: () => void;
};

function RecommendationRow({ item, onPress }: RecommendationRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.durationSeconds / 60} minutes, ${formatCount(item.views)} views`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.thumb, { backgroundColor: item.accent }]}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(item.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.text}>
        <View style={[styles.reason, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
            {item.reason}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
          {item.channelName}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
          {formatCount(item.views)} views · {item.courseTitle}
        </ThemedText>
      </View>
    </Pressable>
  );
}

type RecommendationsProps = {
  items: Recommendation[];
  onSelect: (lessonId: string) => void;
};

export function Recommendations({ items, onSelect }: RecommendationsProps) {
  const theme = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Recommended for you</ThemedText>
        <View style={styles.headerActions}>
          <ThemedText type="label" themeColor="textSecondary">
            Autoplay
          </ThemedText>
          <View style={[styles.switchTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.switchThumb, { backgroundColor: theme.textSecondary }]} />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Watch ${item.title}`}
            onPress={() => onSelect(item.lessonId)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={[styles.cardThumb, { backgroundColor: item.accent }]}>
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
              <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
                <ThemedText type="label" style={styles.badge}>
                  {formatSeconds(item.durationSeconds)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.cardText}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
                {item.channelName}
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
                {formatCount(item.views)} views
              </ThemedText>
              <View style={styles.cardFooter}>
                <ThemedText type="label" themeColor="brand" numberOfLines={1} style={styles.reasonText}>
                  {item.reason}
                </ThemedText>
                <ChevronRight size={13} color={theme.textSecondary} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {items.slice(0, 4).map((item) => (
          <RecommendationRow key={`list-${item.id}`} item={item} onPress={() => onSelect(item.lessonId)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  switchTrack: {
    width: 34,
    height: 18,
    borderRadius: Radius.pill,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: Radius.pill,
  },
  rail: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    width: 196,
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  cardText: {
    gap: 2,
    padding: Spacing.two,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  reasonText: {
    flexShrink: 1,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "center",
  },
  thumb: {
    width: 132,
    aspectRatio: 16 / 9,
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  text: {
    flex: 1,
    gap: 3,
  },
  reason: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  duration: {
    position: "absolute",
    right: 4,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  badge: {
    color: "#FFFFFF",
    fontSize: 10,
  },
});
