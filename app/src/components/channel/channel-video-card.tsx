import { Image } from "expo-image";
import { CircleHelp, Download, FileText, Play, PlayCircle } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Inter,
  Radius,
  Spacing,
} from "@/constants/theme";
import { formatCount, formatSeconds } from "@/data/courses";
import { getChannelById } from "@/data/instructors";
import { useTheme } from "@/hooks/use-theme";
import type { LucideIcon } from "lucide-react-native";
import type { LessonType } from "@/types/course";
import type { ChannelVideo, StandaloneVideo } from "@/types/instructor";

const TYPE_ICONS: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: CircleHelp,
  download: Download,
};

type ChannelVideoCardProps = {
  video: ChannelVideo;
  width: number;
  onPress: () => void;
};

export function ChannelVideoCard({ video, width, onPress }: ChannelVideoCardProps) {
  const theme = useTheme();
  const TypeIcon = TYPE_ICONS[video.type];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${video.durationSeconds / 60} minutes, ${formatCount(video.views)} views`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.thumbnail, { backgroundColor: video.accent }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
        {video.preview ? (
          <View style={[styles.previewBadge, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
            <ThemedText type="label" style={styles.badge}>
              Preview
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={[styles.typeIcon, { backgroundColor: theme.backgroundElement }]}>
          <TypeIcon size={12} color={theme.textSecondary} />
        </View>
        <View style={styles.text}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {video.title}
          </ThemedText>
          <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
            {video.courseTitle}
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.metaLine}>
            {formatCount(video.views)} views · {video.publishedAt}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

type ChannelVideoRowProps = {
  video: ChannelVideo;
  onPress: () => void;
};

export function ChannelVideoRow({ video, onPress }: ChannelVideoRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${video.durationSeconds / 60} minutes, ${formatCount(video.views)} views`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.rowThumb, { backgroundColor: video.accent }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {video.title}
        </ThemedText>
        <View style={styles.rowMeta}>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.metaLine}>
            {formatCount(video.views)} views · {video.publishedAt}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

export type StandaloneVideoLayout = "row" | "feature";

type StandaloneVideoRowProps = {
  video: StandaloneVideo;
  onPress: () => void;
  layout?: StandaloneVideoLayout;
};

export function StandaloneVideoRow({ video, onPress, layout = "row" }: StandaloneVideoRowProps) {
  const theme = useTheme();
  const featured = layout === "feature";
  const channel = getChannelById(video.channelId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${Math.round(video.durationSeconds / 60)} minutes, ${formatCount(video.views)} views`}
      onPress={onPress}
      style={({ pressed }) => [
        featured ? styles.feature : styles.row,
        { opacity: pressed ? 0.75 : 1 },
      ]}>
      <View
        style={[
          featured ? styles.featureThumb : styles.rowThumb,
          { backgroundColor: theme.brand },
        ]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={featured ? styles.featureText : styles.rowText}>
        <ThemedText type={featured ? "default" : "smallBold"} numberOfLines={2}>
          {video.title}
        </ThemedText>
        {featured && channel ? (
          <View style={styles.uploader}>
            <Image
              source={{ uri: channel.avatarUrl }}
              style={styles.uploaderAvatar}
              contentFit="cover"
              transition={200}
            />
            <ThemedText type="small" numberOfLines={1} style={styles.uploaderName}>
              {channel.name}
            </ThemedText>
            <ThemedText
              type="label"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.metaLine}>
              {"· "}
              {formatCount(video.views)} views · {video.publishedAt}
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.metaLine}>
            {formatCount(video.views)} views · {video.publishedAt}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

type StandaloneVideoCardProps = {
  video: StandaloneVideo;
  width: number;
  onPress: () => void;
};

export function StandaloneVideoCard({ video, width, onPress }: StandaloneVideoCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${Math.round(video.durationSeconds / 60)} minutes, ${formatCount(video.views)} views`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.thumbnail, { backgroundColor: theme.brand }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.typeIcon, { backgroundColor: theme.backgroundElement }]}>
          <PlayCircle size={12} color={theme.textSecondary} />
        </View>
        <View style={styles.text}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {video.title}
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.metaLine}>
            {formatCount(video.views)} views · {video.publishedAt}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

type FeaturedStandaloneVideoProps = {
  video: StandaloneVideo;
  onPress: () => void;
};

export function FeaturedStandaloneVideo({
  video,
  onPress,
}: FeaturedStandaloneVideoProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Featured: ${video.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.featured, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.featuredThumbnail, { backgroundColor: theme.brand }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.play}>
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.featuredBody}>
        <View style={styles.featuredLabel}>
          <ThemedText type="label" themeColor="brand">
            FEATURED
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.metaLine}>
            {formatCount(video.views)} views · {video.publishedAt}
          </ThemedText>
        </View>
        <ThemedText type="heading" numberOfLines={2}>
          {video.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {video.description}
        </ThemedText>
      </View>
    </Pressable>
  );
}

type FeaturedVideoProps = {
  video: ChannelVideo;
  onPress: () => void;
};

export function FeaturedVideo({ video, onPress }: FeaturedVideoProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Featured: ${video.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.featured,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 },
      ]}>
      <View style={[styles.featuredThumbnail, { backgroundColor: video.accent }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.play}>
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badge}>
            {formatSeconds(video.durationSeconds)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.featuredBody}>
        <ThemedText type="label" themeColor="brand">
          FEATURED
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={2}>
          {video.title}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary" style={styles.metaLine}>
          {formatCount(video.views)} views · {video.publishedAt}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metaLine: {
    fontFamily: Inter.regular,
    fontWeight: "400",
    letterSpacing: 0,
    textTransform: "none",
  },
  card: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "center",
  },
  rowThumb: {
    width: 156,
    aspectRatio: 16 / 9,
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  feature: {
    gap: Spacing.two,
  },
  featureThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  featureText: {
    paddingHorizontal: Spacing.three,
    gap: 4,
  },
  uploader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  uploaderName: {
    flexShrink: 1,
  },
  uploaderAvatar: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radius.small,
    overflow: "hidden",
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
  previewBadge: {
    position: "absolute",
    left: 4,
    top: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  body: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  typeIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  featured: {
    overflow: "hidden",
  },
  featuredThumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  featuredBody: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  featuredLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
});
