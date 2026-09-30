import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TriangleAlert } from "lucide-react-native";

import { ChannelCourseCard } from "@/components/channel/channel-course-card";
import {
  ChannelBanner,
  ChannelIdentity,
  ChannelNavBar,
} from "@/components/channel/channel-header";
import { ChannelPostCard } from "@/components/channel/channel-post-card";
import {
  ChannelAbout,
  ChannelActions,
  ChannelEmpty,
  ChannelFeed,
  ChannelSectionTitle,
  ChannelStore,
  ChannelTabBar,
  CHANNEL_TABS,
  ChannelVideoRail,
  StandaloneChannelFeatured,
  StandaloneVideoList,
  type ChannelTabName,
} from "@/components/channel/channel-sections";
import { CourseCard } from "@/components/course-card";
import { ThemedText } from "@/components/themed-text";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { getCourseById } from "@/data/courses";
import {
  getChannelById,
  getChannelPosts,
  getChannelStandaloneVideos,
} from "@/data/instructors";
import { usePortraitLock } from "@/hooks/use-portrait-lock";
import { useTheme } from "@/hooks/use-theme";

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function ChannelScreen() {
  const { instructorId } = useLocalSearchParams<{ instructorId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [tab, setTab] = useState<ChannelTabName>("Home");
  const [subscribed, setSubscribed] = useState(false);
  const [pagerWidth, setPagerWidth] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const pageWidth = pagerWidth > 0 ? pagerWidth : Math.min(windowWidth, MaxContentWidth);

  const handleTabChange = (next: ChannelTabName) => {
    setTab(next);
    const index = CHANNEL_TABS.indexOf(next);
    pagerRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  };

  const syncTabToOffset = (offsetX: number) => {
    if (pageWidth <= 0) return;
    const position = offsetX / pageWidth;
    const rounded = Math.round(position);
    if (Math.abs(position - rounded) > 0.02) return;
    const index = Math.min(Math.max(rounded, 0), CHANNEL_TABS.length - 1);
    setTab((current) => (current === CHANNEL_TABS[index] ? current : CHANNEL_TABS[index]));
  };

  const handlePagerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncTabToOffset(event.nativeEvent.contentOffset.x);
  };

  const handlePagerSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncTabToOffset(event.nativeEvent.contentOffset.x);
  };

  usePortraitLock();

  const channel = getChannelById(instructorId ?? "");

  if (!channel) {
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
        <ThemedText type="heading">Channel not found</ThemedText>
      </View>
    );
  }

  const courses = channel.courseIds
    .map((id) => getCourseById(id))
    .filter((course) => course !== undefined);
  const posts = getChannelPosts(channel.id);
  const videos = getChannelStandaloneVideos(channel.id);

  const featured = [...videos].sort((a, b) => b.views - a.views)[0];
  const recent = [...videos]
    .reverse()
    .filter((video) => video.id !== featured?.id)
    .slice(0, 4);

  const openVideo = (id: string) => {
    router.push({ pathname: "/video/[videoId]", params: { videoId: id } });
  };

  const renderTab = (name: ChannelTabName) => {
    if (name === "Home") {
      return (
        <>
          {featured ? (
            <StandaloneChannelFeatured
              video={featured}
              onPress={() => openVideo(featured.id)}
            />
          ) : null}

          {recent.length > 0 ? (
            <View style={styles.section}>
              <ChannelSectionTitle onSeeAll={() => handleTabChange("Video")}>
                Recent uploads
              </ChannelSectionTitle>
              <StandaloneVideoList
                videos={recent}
                onOpen={(video) => openVideo(video.id)}
                emptyLabel="No uploads yet."
              />
            </View>
          ) : null}

          {courses.length > 0 ? (
            <View style={styles.section}>
              <ChannelSectionTitle onSeeAll={() => handleTabChange("Course")}>
                Courses
              </ChannelSectionTitle>
              <ChannelVideoRail>
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} width={230} />
                ))}
              </ChannelVideoRail>
            </View>
          ) : null}

          <View style={styles.section}>
            <ChannelSectionTitle>About</ChannelSectionTitle>
            <ChannelAbout channel={channel} />
          </View>
        </>
      );
    }

    if (name === "Video") {
      return (
        <View style={styles.section}>
          <StandaloneVideoList
            videos={videos}
            onOpen={(video) => openVideo(video.id)}
            emptyLabel="No videos published yet."
          />
        </View>
      );
    }

    if (name === "Course") {
      if (courses.length === 0) return <ChannelEmpty label="No courses published yet." />;
      return (
        <ChannelStore>
          {courses.map((course, index) => (
            <ChannelCourseCard
              key={course.id}
              course={course}
              isLast={index === courses.length - 1}
            />
          ))}
        </ChannelStore>
      );
    }

    if (posts.length === 0) return <ChannelEmpty label="No posts yet." />;
    return (
      <ChannelFeed>
        {posts.map((post, index) => (
          <ChannelPostCard
            key={post.id}
            post={post}
            channel={channel}
            isLast={index === posts.length - 1}
            onOpen={() =>
              router.push({
                pathname: "/lesson/[lessonId]",
                params: { lessonId: post.lessonId },
              })
            }
          />
        ))}
      </ChannelFeed>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ChannelNavBar onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: MaxContentWidth,
            paddingBottom: insets.bottom + Spacing.five,
          },
        ]}
      >
        <ChannelBanner uri={channel.bannerUrl} accent={channel.accent} />

        <View style={styles.identityWrap}>
          <ChannelIdentity
            name={channel.name}
            handle={channel.handle}
            title={channel.title}
            accent={channel.accent}
            avatarUrl={channel.avatarUrl}
            followers={formatFollowers(channel.followers)}
          />
          <ChannelActions
            following={subscribed}
            onToggleFollow={() => setSubscribed((value) => !value)}
          />
        </View>

        <ChannelTabBar
          active={tab}
          onChange={handleTabChange}
          counts={{
            Video: videos.length,
            Course: courses.length,
            Posts: posts.length,
          }}
        />

        <View
          style={styles.pager}
          onLayout={(event) => setPagerWidth(event.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handlePagerScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handlePagerSettled}
            onScrollEndDrag={handlePagerSettled}
            style={styles.pagerScroll}
          >
            {CHANNEL_TABS.map((name) => (
              <View key={name} style={[styles.page, { width: pageWidth }]}>
                {renderTab(name)}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: "100%",
    alignSelf: "center",
    gap: Spacing.four,
    paddingTop: Spacing.two,
  },
  identityWrap: {
    gap: Spacing.three,
    marginTop: -Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  pager: {
    width: "100%",
    overflow: "hidden",
  },
  pagerScroll: {
    flexGrow: 0,
  },
  page: {
    gap: Spacing.four,
  },
  sellStrip: {
    gap: Spacing.two,
  },
  sellBadge: {
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
