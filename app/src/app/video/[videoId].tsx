import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { StandaloneVideoList } from "@/components/channel/channel-sections";
import { PlayerSurface } from "@/components/player/player-surface";
import { VideoDiscussionSheet } from "@/components/video/video-discussion-sheet";
import { VideoInfoSheet } from "@/components/video/video-info-sheet";
import { Radius, Spacing } from "@/constants/theme";
import { formatCount } from "@/data/courses";
import { getChannelById } from "@/data/instructors";
import { getChannelVideoById, STANDALONE_VIDEOS } from "@/data/videos";
import { usePortraitLock } from "@/hooks/use-portrait-lock";
import { useTheme } from "@/hooks/use-theme";
import {
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react-native";

import type { Quality } from "@/types/course";

export default function VideoScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [quality, setQuality] = useState<Quality>("auto");
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  usePortraitLock();

  const video = getChannelVideoById(videoId ?? "");
  const channel = video ? getChannelById(video.channelId) : undefined;

  const player = useVideoPlayer(video?.videoUrl ?? null, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
    instance.loop = false;
    instance.play();
  });

  const loadedVideoId = useRef(video?.id);
  useEffect(() => {
    if (!video || loadedVideoId.current === video.id) return;
    loadedVideoId.current = video.id;
    setQuality("auto");
    void player
      .replaceAsync(video.videoUrl)
      .then(() => {
        player.currentTime = 0;
        player.play();
      })
      .catch(() => {});
  }, [video, player]);

  const changeQuality = (next: Quality) => {
    if (!video || next === quality) return;

    setQuality(next);
    const resumeAt = player.currentTime;
    const shouldResume = player.playing;

    void player
      .replaceAsync(
        next === "auto" ? video.videoUrl : video.videoVariants[next],
      )
      .then(() => {
        player.currentTime = resumeAt;
        if (shouldResume) player.play();
      })
      .catch(() => {});
  };

  const siblings = video
    ? STANDALONE_VIDEOS.filter((item) => item.channelId === video.channelId)
    : [];
  const nextVideo = video
    ? siblings[
        (siblings.findIndex((item) => item.id === video.id) + 1) %
          siblings.length
      ]
    : undefined;

  const otherVideos = video
    ? STANDALONE_VIDEOS.filter((item) => item.id !== video.id)
    : [];
  const recommendations = video
    ? [
        ...otherVideos.filter((item) => item.channelId === video.channelId),
        ...otherVideos.filter((item) => item.channelId !== video.channelId),
      ].slice(0, 6)
    : [];

  const goToVideo = (id: string) => {
    router.replace({ pathname: "/video/[videoId]", params: { videoId: id } });
  };

  const shareVideo = () => {
    if (!video) return;
    void Share.share({ message: `${video.title} · ${channel?.name ?? ""}` });
  };

  if (!video || !channel) {
    return (
      <View
        style={[
          styles.fallback,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + Spacing.five,
          },
        ]}
      >
        <TriangleAlert size={40} color={theme.textSecondary} />
        <ThemedText type="heading">Video not found</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="brand">
            Go back
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const likes = video.likes + (liked ? 1 : 0) - (disliked ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PlayerSurface
        player={player}
        source={
          quality === "auto" ? video.videoUrl : video.videoVariants[quality]
        }
        title={video.title}
        hasNext={Boolean(nextVideo)}
        quality={quality}
        onQualityChange={changeQuality}
        onBack={() => router.back()}
        onNext={() => {
          if (nextVideo) goToVideo(nextVideo.id);
        }}
        onEnded={() => {
          if (nextVideo) goToVideo(nextVideo.id);
        }}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText type="heading" numberOfLines={1}>
            {video.title}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText
              type="label"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.metaItem}
            >
              {channel.handle}
            </ThemedText>
            <ThemedText
              type="label"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.metaItem}
            >
              {formatCount(likes)} likes
            </ThemedText>
            <ThemedText
              type="label"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.metaItem}
            >
              {formatCount(video.views)} views
            </ThemedText>
            <ThemedText
              type="label"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.metaItem}
            >
              {video.publishedAt}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More video details"
              onPress={() => setShowInfo(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.moreButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <ThemedText
                type="label"
                themeColor="brand"
                style={styles.moreLabel}
              >
                More
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open channel for ${channel.name}`}
            onPress={() =>
              router.push({
                pathname: "/instructor/[instructorId]",
                params: { instructorId: channel.id },
              })
            }
            style={({ pressed }) => [
              styles.channelRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: channel.accent }]}>
              <ThemedText type="smallBold" style={styles.avatarText}>
                {channel.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.channelText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {channel.name}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
              >
                {channel.handle}
              </ThemedText>
            </View>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: liked }}
              accessibilityLabel={liked ? "Remove like" : "Like this video"}
              onPress={() => {
                setLiked((value) => !value);
                setDisliked(false);
              }}
              style={[styles.action, liked ? styles.actionActive : null]}
            >
              <ThumbsUp
                size={18}
                color={liked ? theme.brand : theme.text}
                fill={liked ? theme.brand : "none"}
              />
              <ThemedText type="smallBold">{formatCount(likes)}</ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: disliked }}
              accessibilityLabel={
                disliked ? "Remove dislike" : "Dislike this video"
              }
              onPress={() => {
                setDisliked((value) => !value);
                setLiked(false);
              }}
              style={[styles.action, disliked ? styles.actionActive : null]}
            >
              <ThumbsDown
                size={18}
                color={disliked ? theme.brand : theme.text}
                fill={disliked ? theme.brand : "none"}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share this video"
              onPress={shareVideo}
              style={styles.action}
            >
              <Share2 size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open discussion, ${formatCount(video.comments)} ${video.comments === 1 ? "comment" : "comments"}`}
          onPress={() => setShowDiscussion(true)}
          style={[
            styles.discussionCard,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <MessageCircle size={18} color={theme.brand} />
          <View style={styles.discussionSummary}>
            <ThemedText type="smallBold">Discussion</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatCount(video.comments)}{" "}
              {video.comments === 1 ? "comment" : "comments"}
            </ThemedText>
          </View>
        </Pressable>

        {recommendations.length > 0 ? (
          <View style={styles.recommended}>
            <ThemedText type="subtitle">Recommended for you</ThemedText>
            <StandaloneVideoList
              videos={recommendations}
              onOpen={(item) => goToVideo(item.id)}
              emptyLabel="No recommendations yet."
            />
          </View>
        ) : null}

      </ScrollView>

      <VideoInfoSheet
        visible={showInfo}
        topOffset={insets.top + (windowWidth * 9) / 16}
        onClose={() => setShowInfo(false)}
        video={video}
        channel={channel}
        likes={likes}
      />
      <VideoDiscussionSheet
        visible={showDiscussion}
        topOffset={insets.top + (windowWidth * 9) / 16}
        onClose={() => setShowDiscussion(false)}
        videoId={video.id}
        totalCount={video.comments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  metaItem: {
    flexShrink: 1,
    letterSpacing: 0,
    textTransform: "none",
  },
  moreButton: {
    marginLeft: "auto",
    paddingHorizontal: Spacing.one,
  },
  moreLabel: {
    letterSpacing: 0,
    textTransform: "none",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 36,
    borderRadius: Radius.pill,
  },
  actionActive: {
    opacity: 1,
  },
  discussionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  discussionSummary: {
    gap: Spacing.one,
  },
  recommended: {
    gap: Spacing.three,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
});
