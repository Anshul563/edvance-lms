import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseThumbnail } from "@/components/course-thumbnail";
import { LessonList } from "@/components/player/lesson-list";
import { MiniPlayer } from "@/components/player/mini-player";
import { PlayerSurface } from "@/components/player/player-surface";
import { Recommendations } from "@/components/player/recommendations";
import { ThemedText } from "@/components/themed-text";
import {
  Hairline,
  Radius,
  Spacing,
} from "@/constants/theme";
import { formatDuration, getCourseLessons, getLessonContext, totalLessons } from "@/data/courses";
import {
  formatTimeAgo,
  getInitialsOf,
  getLessonDiscussions,
  type Discussion,
  type DiscussionReply,
} from "@/data/discussions";
import { getChannelIdByInstructorName } from "@/data/instructors";
import { PROFILE } from "@/data/profile";
import { getRecommendations } from "@/data/recommendations";
import { usePortraitLock } from "@/hooks/use-portrait-lock";
import { useTheme } from "@/hooks/use-theme";
import type { LucideIcon } from "lucide-react-native";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronUp,
  CloudDownload,
  CornerDownRight,
  Download,
  FileText,
  Folder,
  MessageCircle,
  Pin,
  PlayCircle,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  Trophy,
} from "lucide-react-native";

import type { Quality } from "@/types/course";

const TABS = ["Lessons", "Discussions", "Resources", "Overview"] as const;
type Tab = (typeof TABS)[number];

const RESOURCES: { icon: LucideIcon; title: string; meta: string }[] = [
  { icon: FileText, title: "Course slides", meta: "PDF · 12 MB" },
  { icon: Folder, title: "Starter project files", meta: "ZIP · 48 MB" },
  { icon: Bookmark, title: "Cheatsheet", meta: "PDF · 1.2 MB" },
];

export default function LessonPlayerScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("Lessons");
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [postedThreads, setPostedThreads] = useState<Discussion[]>([]);
  const [postedReplies, setPostedReplies] = useState<Record<string, DiscussionReply[]>>({});
  const [replyDraft, setReplyDraft] = useState("");
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [votedThreadIds, setVotedThreadIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [quality, setQuality] = useState<Quality>("auto");
  const [minimized, setMinimized] = useState(false);
  usePortraitLock();

  const context = getLessonContext(lessonId ?? "");
  const course = context?.course;
  const lesson = context?.lesson;

  const player = useVideoPlayer(lesson?.videoUrl ?? null, (instance) => {
    instance.timeUpdateEventInterval = 0.25;
    instance.loop = false;
    instance.play();
  });

  const loadedLessonId = useRef(lesson?.id);
  useEffect(() => {
    if (!lesson || loadedLessonId.current === lesson.id) return;
    loadedLessonId.current = lesson.id;
    setQuality("auto");
    void player
      .replaceAsync(lesson.videoUrl)
      .then(() => {
        player.currentTime = 0;
        player.play();
      })
      .catch(() => {});
  }, [lesson, player]);

  useEffect(() => {
    if (!minimized) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setMinimized(false);
      return true;
    });

    return () => subscription.remove();
  }, [minimized]);

  const changeQuality = (next: Quality) => {    if (!lesson || next === quality) return;

    setQuality(next);
    const resumeAt = player.currentTime;
    const shouldResume = player.playing;

    void player
      .replaceAsync(next === "auto" ? lesson.videoUrl : lesson.videoVariants[next])
      .then(() => {
        player.currentTime = resumeAt;
        if (shouldResume) player.play();
      })
      .catch(() => {});
  };

  const goToLesson = (id: string) => {
    router.replace({ pathname: "/lesson/[lessonId]", params: { lessonId: id } });
  };

  if (!context || !course || !lesson) {
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: theme.background, paddingTop: insets.top + Spacing.five },
        ]}>
        <TriangleAlert size={40} color={theme.textSecondary} />
        <ThemedText type="heading">Lesson not found</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="brand">
            Go back
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const lessons = getCourseLessons(course);
  const completedIds = new Set(lessons.slice(0, context.index).map((item) => item.id));
  const nextLesson = lessons[context.index + 1];

  const shareLesson = () => {
    void Share.share({ message: `${lesson.title} · ${course.title}` });
  };

  const openInstructor = () => {
    router.push({
      pathname: "/instructor/[instructorId]",
      params: { instructorId: getChannelIdByInstructorName(course.instructor.name) },
    });
  };

  const recommended = getRecommendations(lesson.id, course.id);

  const threads = [...postedThreads, ...getLessonDiscussions(lesson.id)].map((thread) => {
    const extra = postedReplies[thread.id];
    return extra && extra.length > 0 ? { ...thread, replies: [...extra, ...thread.replies] } : thread;
  });

  const toggleThreadVote = (threadId: string) => {
    setVotedThreadIds((ids) =>
      ids.includes(threadId) ? ids.filter((id) => id !== threadId) : [...ids, threadId],
    );
  };

  const postQuestion = () => {
    const body = draft.trim();
    if (!body) return;

    const created: Discussion = {
      id: `thread-${lesson.id}-${postedThreads.length + 1}`,
      lessonId: lesson.id,
      author: PROFILE.firstName,
      authorTitle: "Learner",
      title: body.length > 60 ? `${body.slice(0, 60)}...` : body,
      body,
      postedAt: new Date().toISOString(),
      upvotes: 0,
      replies: [],
    };

    setPostedThreads((current) => [created, ...current]);
    setDraft("");
  };

  const postReply = (threadId: string) => {
    const body = replyDraft.trim();
    if (!body) return;

    const created: DiscussionReply = {
      id: `reply-${threadId}-${Object.keys(postedReplies).length + 1}`,
      author: PROFILE.firstName,
      authorTitle: "Learner",
      postedAt: new Date().toISOString(),
      upvotes: 0,
      body,
      fromInstructor: false,
    };

    setPostedReplies((current) => ({
      ...current,
      [threadId]: [created, ...(current[threadId] ?? [])],
    }));
    setReplyDraft("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PlayerSurface
        player={player}
        source={quality === "auto" ? lesson.videoUrl : lesson.videoVariants[quality]}
        title={lesson.title}
        hasNext={Boolean(nextLesson)}
        quality={quality}
        onQualityChange={changeQuality}
        onBack={() => router.back()}
        onNext={() => {
          if (nextLesson) goToLesson(nextLesson.id);
        }}
        onEnded={() => {
          if (nextLesson) goToLesson(nextLesson.id);
        }}
        minimized={minimized}
        onMinimize={() => setMinimized(true)}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="heading">{lesson.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {course.title} · {context.section.title}
          </ThemedText>
        </View>

        <View style={styles.channelRow}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open channel for ${course.instructor.name}`}
            onPress={openInstructor}
            style={({ pressed }) => [styles.channelIdentity, { opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.avatar, { backgroundColor: course.accent }]}>
              <ThemedText type="smallBold" style={styles.avatarText}>
                {course.instructor.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.channelText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {course.instructor.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {course.instructor.title}
              </ThemedText>
            </View>
          </Pressable>
          <View style={styles.channelActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: liked }}
              accessibilityLabel={liked ? "Remove like" : "Like this lesson"}
              hitSlop={8}
              onPress={() => {
                setLiked((value) => !value);
                setDisliked(false);
              }}
              style={[styles.channelAction, liked ? styles.channelActionActive : null]}>
              <ThumbsUp
                size={18}
                color={liked ? theme.brand : theme.text}
                fill={liked ? theme.brand : "none"}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: disliked }}
              accessibilityLabel={disliked ? "Remove dislike" : "Dislike this lesson"}
              hitSlop={8}
              onPress={() => {
                setDisliked((value) => !value);
                setLiked(false);
              }}
              style={[styles.channelAction, disliked ? styles.channelActionActive : null]}>
              <ThumbsDown
                size={18}
                color={disliked ? theme.brand : theme.text}
                fill={disliked ? theme.brand : "none"}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share this lesson"
              hitSlop={8}
              onPress={shareLesson}
              style={styles.channelAction}>
              <Share2 size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <Recommendations items={recommended} onSelect={(lessonId) => goToLesson(lessonId)} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Hide lesson details" : "Show lesson details"}
          onPress={() => setExpanded((value) => !value)}
          style={[styles.description, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" numberOfLines={1}>
            Lesson {context.index + 1} of {context.total} · {lesson.durationMinutes} min ·{" "}
            {formatDuration(course.durationMinutes)} total
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={expanded ? undefined : 2}>
            {course.description}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {expanded ? "Show less" : "Show more"}
          </ThemedText>
        </Pressable>

        <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
          {TABS.map((item) => {
            const active = item === tab;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setTab(item)}
                style={styles.tabButton}>
                <ThemedText
                  type={active ? "smallBold" : "small"}
                  themeColor={active ? "text" : "textSecondary"}>
                  {item}
                </ThemedText>
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: active ? theme.brand : "transparent" },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {tab === "Lessons" ? (
          <View style={styles.tabContent}>
            <LessonList
              course={course}
              currentLessonId={lesson.id}
              completedIds={completedIds}
              onSelect={goToLesson}
            />

            {nextLesson ? (
              <View style={styles.block}>
                <ThemedText type="heading">Up next</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => goToLesson(nextLesson.id)}
                  style={[styles.upNext, { backgroundColor: theme.backgroundElement }]}>
                  <CourseThumbnail
                    uri={course.image}
                    accent={course.accent}
                    radius={Radius.medium}
                    style={styles.upNextThumb}
                  />
                  <View style={styles.upNextText}>
                    <ThemedText type="smallBold" numberOfLines={2}>
                      {nextLesson.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {nextLesson.durationMinutes}m · {course.instructor.name}
                    </ThemedText>
                  </View>
                  <PlayCircle size={30} color={theme.brand} fill={theme.brand} />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.completeCard, { backgroundColor: theme.backgroundElement }]}>
                <Trophy size={28} color={theme.success} />
                <ThemedText type="smallBold">You finished this course</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Nice work. Revisit any lesson from the list above.
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}

        {tab === "Overview" ? (
          <View style={styles.tabContent}>
            <View style={[styles.instructorRow, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.avatar, { backgroundColor: course.accent }]}>
                <ThemedText type="heading" style={styles.avatarText}>
                  {course.instructor.name.charAt(0)}
                </ThemedText>
              </View>
              <View style={styles.instructorText}>
                <ThemedText type="smallBold">{course.instructor.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {course.instructor.title}
                </ThemedText>
              </View>
            </View>

            <View style={styles.block}>
              <ThemedText type="heading">About this course</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {course.description}
              </ThemedText>
            </View>

            <View style={styles.block}>
              <ThemedText type="heading">What you&apos;ll learn</ThemedText>
              <View style={styles.outcomes}>
                {course.outcomes.map((outcome) => (
                  <View key={outcome} style={styles.outcomeRow}>
                    <Check size={18} color={theme.success} strokeWidth={2.5} />
                    <ThemedText type="body" style={styles.outcomeText}>
                      {outcome}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.block}>
              <ThemedText type="heading">Course details</ThemedText>
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Level
                </ThemedText>
                <ThemedText type="smallBold">{course.level}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Lessons
                </ThemedText>
                <ThemedText type="smallBold">{totalLessons(course)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Total length
                </ThemedText>
                <ThemedText type="smallBold">{formatDuration(course.durationMinutes)}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Updated
                </ThemedText>
                <ThemedText type="smallBold">{course.updatedAt}</ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        {tab === "Resources" ? (
          <View style={styles.tabContent}>
            <View style={styles.block}>
              <ThemedText type="heading">Downloads</ThemedText>
              {RESOURCES.map((resource) => {
                const ResourceIcon = resource.icon;
                return (
                <Pressable
                  key={resource.title}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.resourceRow,
                    { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <View style={[styles.resourceIcon, { backgroundColor: theme.brandMuted }]}>
                    <ResourceIcon size={18} color={theme.brand} />
                  </View>
                  <View style={styles.resourceText}>
                    <ThemedText type="smallBold">{resource.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {resource.meta}
                    </ThemedText>
                  </View>
                  <Download size={20} color={theme.textSecondary} />
                </Pressable>
                );
              })}
            </View>

            <View style={[styles.completeCard, { backgroundColor: theme.backgroundElement }]}>
              <CloudDownload size={26} color={theme.brand} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Resources are available offline once downloaded.
              </ThemedText>
            </View>
          </View>
        ) : null}

        {tab === "Discussions" ? (
          <View style={styles.tabContent}>
            <View style={styles.discussionComposer}>
              <View style={[styles.composerAvatar, { backgroundColor: course.accent }]}>
                <ThemedText type="label" style={styles.composerAvatarText}>
                  {getInitialsOf(PROFILE.firstName)}
                </ThemedText>
              </View>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Add a question for the class"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[
                  styles.composerInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: draft.trim() ? theme.brand : theme.border,
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Post question"
                accessibilityState={{ disabled: draft.trim().length === 0 }}
                disabled={draft.trim().length === 0}
                onPress={postQuestion}
                style={({ pressed }) => [
                  styles.composerSend,
                  {
                    backgroundColor: draft.trim() ? theme.brand : theme.backgroundSelected,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Send size={16} color={draft.trim() ? "#FFFFFF" : theme.textSecondary} />
              </Pressable>
            </View>

            {threads.length === 0 ? (
              <View style={styles.discussionEmpty}>
                <MessageCircle size={24} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  No questions yet. Ask the first one.
                </ThemedText>
              </View>
            ) : (
              <View
                style={[
                  styles.discussionPanel,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                {threads.map((thread, index) => {
                  const open = openThreadId === thread.id;
                  const voted = votedThreadIds.includes(thread.id);
                  const upvotes = thread.upvotes + (voted ? 1 : 0);

                  return (
                    <View key={thread.id}>
                      {index > 0 ? (
                        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                      ) : null}

                      <View style={styles.discussionRow}>
                        <View style={styles.discussionRowTop}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${thread.title} by ${thread.author}`}
                            accessibilityState={{ expanded: open }}
                            onPress={() => setOpenThreadId(open ? null : thread.id)}
                            style={styles.discussionMain}>
                            <View style={[styles.avatar, { backgroundColor: course.accent }]}>
                              <ThemedText type="label" style={styles.avatarText}>
                                {getInitialsOf(thread.author)}
                              </ThemedText>
                            </View>

                            <View style={styles.discussionBody}>
                              <View style={styles.discussionHeader}>
                                <ThemedText type="smallBold" numberOfLines={1} style={styles.authorName}>
                                  {thread.author}
                                </ThemedText>
                                {thread.pinned ? (
                                  <Pin size={11} color={theme.brand} strokeWidth={2.5} />
                                ) : null}
                                {thread.authorTitle !== "Learner" ? (
                                  <ThemedText type="label" themeColor="textSecondary">
                                    {thread.authorTitle}
                                  </ThemedText>
                                ) : null}
                                <ThemedText type="label" themeColor="textSecondary">
                                  · {formatTimeAgo(thread.postedAt)}
                                </ThemedText>
                              </View>

                              <ThemedText type="small" numberOfLines={open ? undefined : 3}>
                                {thread.body}
                              </ThemedText>

                              <View style={styles.discussionFooter}>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityState={{ expanded: open }}
                                  accessibilityLabel={`${thread.replies.length} replies`}
                                  hitSlop={8}
                                  onPress={() => setOpenThreadId(open ? null : thread.id)}
                                  style={styles.footerAction}>
                                  <CornerDownRight size={13} color={theme.textSecondary} />
                                  <ThemedText type="label" themeColor="textSecondary">
                                    {thread.replies.length === 0
                                      ? "Reply"
                                      : `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}`}
                                  </ThemedText>
                                </Pressable>

                                {thread.resolved ? (
                                  <View style={styles.footerAction}>
                                    <CheckCircle2 size={12} color={theme.success} />
                                    <ThemedText type="label" themeColor="success">
                                      Resolved
                                    </ThemedText>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: voted }}
                            accessibilityLabel={`Upvote, ${upvotes} upvotes`}
                            hitSlop={8}
                            onPress={() => toggleThreadVote(thread.id)}
                            style={[
                              styles.votePill,
                              {
                                borderColor: voted ? theme.brand : theme.border,
                                backgroundColor: voted ? theme.brandMuted : "transparent",
                              },
                            ]}>
                            <ChevronUp
                              size={13}
                              color={voted ? theme.brand : theme.textSecondary}
                              strokeWidth={3}
                            />
                            <ThemedText
                              type="label"
                              themeColor={voted ? "brand" : "textSecondary"}>
                              {upvotes}
                            </ThemedText>
                          </Pressable>
                        </View>

                        {open ? (
                          <View style={styles.replySection}>
                            {thread.replies.map((reply, replyIndex) => (
                              <View key={reply.id}>
                                {replyIndex > 0 ? (
                                  <View
                                    style={[styles.replyDivider, { backgroundColor: theme.border }]}
                                  />
                                ) : null}
                                <View style={styles.reply}>
                                  <View
                                    style={[
                                      styles.replyAvatar,
                                      {
                                        backgroundColor: reply.fromInstructor
                                          ? theme.brand
                                          : theme.backgroundSelected,
                                      },
                                    ]}>
                                    <ThemedText type="label" style={styles.avatarText}>
                                      {getInitialsOf(reply.author)}
                                    </ThemedText>
                                  </View>

                                  <View style={styles.discussionBody}>
                                    <View style={styles.discussionHeader}>
                                      <ThemedText
                                        type="smallBold"
                                        numberOfLines={1}
                                        style={styles.authorName}>
                                        {reply.author}
                                      </ThemedText>
                                      {reply.fromInstructor ? (
                                        <View
                                          style={[
                                            styles.instructorTag,
                                            { backgroundColor: theme.brandMuted },
                                          ]}>
                                          <ThemedText type="label" themeColor="brand">
                                            {reply.authorTitle}
                                          </ThemedText>
                                        </View>
                                      ) : null}
                                      <ThemedText type="label" themeColor="textSecondary">
                                        · {formatTimeAgo(reply.postedAt)}
                                      </ThemedText>
                                    </View>
                                    <ThemedText type="small" themeColor="textSecondary">
                                      {reply.body}
                                    </ThemedText>
                                  </View>
                                </View>
                              </View>
                            ))}

                            <View
                              style={[
                                styles.replyComposer,
                                {
                                  backgroundColor: theme.background,
                                  borderColor: theme.border,
                                },
                              ]}>
                              <TextInput
                                value={replyDraft}
                                onChangeText={setReplyDraft}
                                placeholder="Add a reply"
                                placeholderTextColor={theme.textSecondary}
                                style={[styles.replyInput, { color: theme.text }]}
                              />
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Post reply"
                                accessibilityState={{ disabled: replyDraft.trim().length === 0 }}
                                disabled={replyDraft.trim().length === 0}
                                onPress={() => postReply(thread.id)}
                                style={({ pressed }) => [
                                  styles.replySend,
                                  {
                                    backgroundColor: replyDraft.trim()
                                      ? theme.brand
                                      : theme.backgroundSelected,
                                    opacity: pressed ? 0.85 : 1,
                                  },
                                ]}>
                                <Send
                                  size={13}
                                  color={replyDraft.trim() ? "#FFFFFF" : theme.textSecondary}
                                />
                              </Pressable>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {minimized ? (
        <MiniPlayer
          player={player}
          title={lesson.title}
          onExpand={() => setMinimized(false)}
          onClose={() => {
            player.pause();
            setMinimized(false);
          }}
        />
      ) : null}
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
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
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
  channelIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  channelText: {
    flex: 1,
    gap: Spacing.half,
  },
  channelActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  channelAction: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  channelActionActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  description: {
    gap: Spacing.one,
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  tabIndicator: {
    height: 2,
    width: "70%",
    borderRadius: Radius.pill,
  },
  tabContent: {
    gap: Spacing.four,
  },
  block: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  outcomes: {
    gap: Spacing.two,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  outcomeText: {
    flex: 1,
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  instructorText: {
    gap: Spacing.half,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.one,
  },
  upNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.large,
  },
  upNextThumb: {
    width: 96,
    height: 64,
  },
  upNextText: {
    flex: 1,
    gap: Spacing.half,
  },
  discussionComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
  },
  composerAvatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  composerAvatarText: {
    color: "#FFFFFF",
  },
  composerInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    fontSize: 13,
    lineHeight: 18,
  },
  composerSend: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  discussionEmpty: {
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  discussionPanel: {
    marginHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  rowDivider: {
    ...Hairline,
    marginLeft: 56,
  },
  discussionRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  discussionRowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  discussionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  discussionBody: {
    flex: 1,
    gap: 3,
  },
  discussionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  authorName: {
    flexShrink: 1,
  },
  discussionFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  votePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  instructorTag: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Radius.small,
  },
  replySection: {
    gap: Spacing.two,
    marginLeft: 44,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  reply: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  replyDivider: {
    ...Hairline,
    marginBottom: Spacing.two,
    marginLeft: 34,
  },
  replyComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  replyInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: Spacing.one,
  },
  replySend: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceText: {
    flex: 1,
    gap: Spacing.half,
  },
  completeCard: {
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
  },
  centerText: {
    textAlign: "center",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
