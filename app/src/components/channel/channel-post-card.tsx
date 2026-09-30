import { Image } from "expo-image";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Hairline,
  Radius,
  Spacing,
} from "@/constants/theme";
import { formatCount, formatSeconds } from "@/data/courses";
import { getInitialsOf } from "@/data/discussions";
import { formatShortMonth } from "@/data/instructors";
import { useTheme } from "@/hooks/use-theme";
import type { Channel, ChannelPost } from "@/types/instructor";

type ChannelPostCardProps = {
  post: ChannelPost;
  channel: Channel;
  onOpen: () => void;
  isLast?: boolean;
};

export function ChannelPostCard({ post, channel, onOpen, isLast }: ChannelPostCardProps) {
  const theme = useTheme();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [draft, setDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const likes = post.likes + (liked ? 1 : 0);

  const postComment = () => {
    if (draft.trim().length === 0) return;
    setComments((value) => value + 1);
    setDraft("");
    setShowComposer(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: channel.avatarUrl }}
          style={[styles.avatar, { backgroundColor: channel.accent }]}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.headerText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {channel.name}
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.handleLine}>
            {channel.handle.toLowerCase()} · {formatShortMonth(post.publishedAt)}
          </ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Post options" hitSlop={10}>
          <MoreHorizontal size={18} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.copy}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {post.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
          {post.caption}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
          From {post.courseTitle} · {formatCount(post.views)} views
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Watch ${post.title}, ${post.durationSeconds / 60} minutes`}
        onPress={onOpen}
        style={[styles.media, { backgroundColor: post.accent }]}>
        <Image
          source={{ uri: post.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          <ThemedText type="label" style={styles.badgeText}>
            {formatSeconds(post.durationSeconds)}
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.reactions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: liked }}
          accessibilityLabel={liked ? "Unlike" : "Like"}
          hitSlop={6}
          onPress={() => setLiked((value) => !value)}
          style={styles.reaction}>
          <Heart
            size={17}
            color={liked ? theme.brand : theme.textSecondary}
            fill={liked ? theme.brand : "none"}
          />
          <ThemedText type="small" themeColor={liked ? "brand" : "textSecondary"}>
            {formatCount(likes)}
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showComposer }}
          accessibilityLabel={`${comments} comments`}
          hitSlop={6}
          onPress={() => setShowComposer((value) => !value)}
          style={styles.reaction}>
          <MessageCircle size={17} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatCount(comments)}
          </ThemedText>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Share" hitSlop={6} style={styles.reaction}>
          <Share2 size={17} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Share
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? "Remove bookmark" : "Bookmark"}
          hitSlop={6}
          onPress={() => setSaved((value) => !value)}
          style={[styles.reaction, styles.reactionEnd]}>
          <Bookmark
            size={17}
            color={saved ? theme.brand : theme.textSecondary}
            fill={saved ? theme.brand : "none"}
          />
        </Pressable>
      </View>

      {showComposer ? (
        <View style={styles.composer}>
          <View style={[styles.commentAvatar, { backgroundColor: channel.accent }]}>
            <ThemedText type="label" style={styles.commentAvatarText}>
              {getInitialsOf(channel.name)}
            </ThemedText>
          </View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            accessibilityState={{ disabled: draft.trim().length === 0 }}
            disabled={draft.trim().length === 0}
            onPress={postComment}
            style={({ pressed }) => [
              styles.send,
              {
                backgroundColor: draft.trim() ? theme.brand : theme.backgroundSelected,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Send size={14} color={draft.trim() ? "#FFFFFF" : theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}
      {isLast ? null : <View style={[styles.separator, { backgroundColor: theme.border }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  separator: {
    ...Hairline,
    marginTop: Spacing.three,
  },
  handleLine: {
    textTransform: "none",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  copy: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  caption: {
    lineHeight: 19,
  },
  media: {
    width: "100%",
    aspectRatio: 16 / 9,
    // borderRadius: Radius.medium,
    overflow: "hidden",
  },
  duration: {
    position: "absolute",
    right: Spacing.one,
    bottom: Spacing.one,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  reactions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  reaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  reactionEnd: {
    marginLeft: "auto",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  commentAvatarText: {
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    fontSize: 13,
  },
  send: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
});
