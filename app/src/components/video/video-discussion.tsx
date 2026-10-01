import { MessageCircle, Send, ThumbsUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatCount } from "@/data/courses";
import { PROFILE } from "@/data/profile";
import {
  formatTimeAgo,
  getInitialsOf,
  getVideoCommentColor,
  getVideoComments,
  makeVideoComment,
} from "@/data/video-discussions";
import { useTheme } from "@/hooks/use-theme";

import type { VideoComment } from "@/data/video-discussions";

function CommentRow({
  comment,
  voted,
  onToggleVote,
}: {
  comment: VideoComment;
  voted: boolean;
  onToggleVote: () => void;
}) {
  const theme = useTheme();
  const color = getVideoCommentColor(comment.videoId, comment.author);
  const upvotes = comment.upvotes + (voted ? 1 : 0);

  return (
    <View style={styles.comment}>
      <View style={[styles.commentAvatar, { backgroundColor: color }]}>
        <ThemedText type="label" style={styles.commentAvatarText}>
          {getInitialsOf(comment.author)}
        </ThemedText>
      </View>

      <View style={styles.commentBody}>
        <View style={styles.commentHead}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.commentAuthor}>
            {comment.author}
          </ThemedText>
          {comment.fromInstructor ? (
            <View style={[styles.roleTag, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="label" themeColor="brand" style={styles.roleTagText}>
                Instructor
              </ThemedText>
            </View>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {formatTimeAgo(comment.postedAt).toLowerCase()}
          </ThemedText>
        </View>

        <ThemedText type="small" style={styles.commentText}>
          {comment.body}
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: voted }}
          accessibilityLabel={voted ? "Remove upvote" : "Upvote comment"}
          onPress={onToggleVote}
          hitSlop={6}
          style={({ pressed }) => [
            styles.vote,
            voted ? { borderColor: theme.brand } : null,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <ThumbsUp
            size={13}
            color={voted ? theme.brand : theme.textSecondary}
            fill={voted ? theme.brand : "none"}
          />
          <ThemedText
            type="label"
            themeColor={voted ? "brand" : "textSecondary"}
            style={voted ? styles.voteCountActive : undefined}>
            {formatCount(upvotes)}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export function VideoDiscussionSection({ videoId, totalCount }: { videoId: string; totalCount: number }) {
  const theme = useTheme();
  const [draft, setDraft] = useState("");
  const [posted, setPosted] = useState<VideoComment[]>([]);
  const [voted, setVoted] = useState<string[]>([]);

  const seeded = getVideoComments(videoId);
  const comments = [...posted, ...seeded];
  const canPost = draft.trim().length > 0;

  const toggleVote = (id: string) => {
    setVoted((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };

  const post = () => {
    if (!canPost) return;
    setPosted((current) => [
      makeVideoComment(videoId, PROFILE.firstName, draft.trim()),
      ...current,
    ]);
    setDraft("");
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <MessageCircle size={18} color={theme.text} />
        <ThemedText type="subtitle">
          {formatCount(totalCount)} {totalCount === 1 ? "comment" : "comments"}
        </ThemedText>
      </View>

      <View style={styles.composer}>
        <View style={[styles.composerAvatar, { backgroundColor: theme.brand }]}>
          <ThemedText type="label" style={styles.commentAvatarText}>
            {getInitialsOf(PROFILE.firstName)}
          </ThemedText>
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment"
          placeholderTextColor={theme.textSecondary}
          multiline
          accessibilityLabel="Add a comment"
          style={[
            styles.composerInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: canPost ? theme.brand : theme.border,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          accessibilityState={{ disabled: !canPost }}
          disabled={!canPost}
          onPress={post}
          style={({ pressed }) => [
            styles.composerSend,
            {
              backgroundColor: canPost ? theme.brand : theme.backgroundSelected,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Send size={16} color={canPost ? "#FFFFFF" : theme.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.separator, { backgroundColor: theme.border }]} />

      <ScrollView
        style={styles.commentsScroll}
        contentContainerStyle={styles.commentsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {comments.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No comments yet. Be the first to say something.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.panel}>
            {comments.map((comment, index) => (
              <View key={comment.id}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                ) : null}
                <CommentRow
                  comment={comment}
                  voted={voted.includes(comment.id)}
                  onToggleVote={() => toggleVote(comment.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    gap: Spacing.three,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
  commentsScroll: {
    flex: 1,
  },
  commentsContent: {
    flexGrow: 1,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.xlarge,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  composerSend: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  empty: {
    paddingHorizontal: Spacing.three,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: Spacing.four,
  },
  panel: {
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  divider: {
    height: 1,
  },
  comment: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  commentAvatarText: {
    color: "#FFFFFF",
  },
  commentBody: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  commentHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  commentAuthor: {
    flexShrink: 0,
    maxWidth: "55%",
  },
  roleTag: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  roleTagText: {
    letterSpacing: 0,
    textTransform: "none",
  },
  commentText: {
    lineHeight: 20,
  },
  vote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
  },
  voteCountActive: {
    letterSpacing: 0,
    textTransform: "none",
  },
});
