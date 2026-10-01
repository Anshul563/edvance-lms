import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from "lucide-react-native";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Hairline,
  Radius,
  Spacing,
} from "@/constants/theme";
import { formatCount } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Channel, ChannelVideo, StandaloneVideo } from "@/types/instructor";

import {
  ChannelVideoCard,
  ChannelVideoRow,
  FeaturedStandaloneVideo,
  FeaturedVideo,
  StandaloneVideoCard,
  StandaloneVideoRow,
  type StandaloneVideoLayout,
} from "./channel-video-card";

export const CHANNEL_TABS = ["Home", "Video", "Course", "Posts"] as const;

type ChannelActionsProps = {
  following: boolean;
  onToggleFollow: () => void;
};

export function ChannelActions({ following, onToggleFollow }: ChannelActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
        accessibilityLabel={following ? "Unsubscribe from channel" : "Subscribe to channel"}
        onPress={onToggleFollow}
        style={({ pressed }) => [
          styles.primaryAction,
          {
            backgroundColor: following ? theme.backgroundSelected : theme.brand,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        {following ? <Check size={15} color={theme.text} strokeWidth={3} /> : null}
        <ThemedText type="smallBold" style={following ? undefined : styles.actionLabel}>
          {following ? "Subscribed" : "Subscribe"}
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message channel"
        style={({ pressed }) => [
          styles.secondaryAction,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
        ]}>
        <MessageSquare size={15} color={theme.text} />
        <ThemedText type="smallBold">Message</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notification settings"
        style={({ pressed }) => [
          styles.iconAction,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Bell size={16} color={theme.text} />
      </Pressable>
    </View>
  );
}

type ChannelTabLayout = { x: number; width: number };

type ChannelTabBarProps = {
  active: ChannelTabName;
  onChange: (tab: ChannelTabName) => void;
  counts?: Partial<Record<ChannelTabName, number>>;
};

export function ChannelTabBar({ active, onChange, counts }: ChannelTabBarProps) {
  const theme = useTheme();
  const [layouts, setLayouts] = useState<Record<string, ChannelTabLayout>>({});
  const [slide] = useState(() => new Animated.Value(0));
  const [stretch] = useState(() => new Animated.Value(0));

  const activeLayout = layouts[active];

  useEffect(() => {
    if (!activeLayout) return;

    Animated.parallel([
      Animated.timing(slide, {
        toValue: activeLayout.x,
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(stretch, {
        toValue: activeLayout.width,
        duration: 260,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, slide, stretch]);

  return (
    <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
      {CHANNEL_TABS.map((item) => {
        const isActive = item === active;
        const count = counts?.[item];

        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={
              count === undefined ? `${item} tab` : `${item} tab, ${count} items`
            }
            onPress={() => onChange(item)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setLayouts((current) => {
                const previous = current[item];
                if (previous && previous.x === x && previous.width === width) return current;
                return { ...current, [item]: { x, width } };
              });
            }}
            style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={styles.tabLabel}>
              <ThemedText
                type="smallBold"
                themeColor={isActive ? "text" : "textSecondary"}>
                {item}
              </ThemedText>
              {count === undefined ? null : (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive ? theme.brand : theme.backgroundSelected,
                    },
                  ]}>
                  <ThemedText
                    type="label"
                    style={[styles.badgeText, { color: isActive ? "#FFFFFF" : theme.textSecondary }]}>
                    {formatCount(count)}
                  </ThemedText>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {activeLayout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              backgroundColor: theme.brand,
              width: stretch,
              transform: [{ translateX: slide }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function ChannelStats({ channel }: { channel: Channel }) {
  const theme = useTheme();

  const items = [
    { icon: Users, value: formatCount(channel.students), label: "Enrolled" },
    { icon: Briefcase, value: String(channel.courseIds.length), label: "Courses" },
    { icon: Star, value: channel.rating.toFixed(1), label: "Rating" },
  ];

  return (
    <View style={[styles.stats, { backgroundColor: theme.backgroundElement }]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.stat,
            index > 0 ? { borderLeftColor: theme.border, borderLeftWidth: 1 } : null,
          ]}>
          <View style={styles.statValue}>
            <item.icon size={14} color={theme.textSecondary} />
            <ThemedText type="smallBold">{item.value}</ThemedText>
          </View>
          <ThemedText type="label" themeColor="textSecondary">
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export function ChannelAbout({ channel }: { channel: Channel }) {
  const theme = useTheme();

  return (
    <View style={styles.about}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
        {channel.bio}
      </ThemedText>

      <View style={styles.detailRow}>
        <Briefcase size={13} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {channel.company}
        </ThemedText>
      </View>
      <View style={styles.detailRow}>
        <MapPin size={13} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {channel.location}
        </ThemedText>
      </View>

      <View style={styles.tagRow}>
        {channel.expertise.map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="label" themeColor="textSecondary">
              {tag}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.tagRow}>
        {channel.links.map((link) => (
          <Pressable
            key={link.label}
            accessibilityRole="link"
            accessibilityLabel={`${link.label}, ${link.handle}`}
            hitSlop={6}
            style={({ pressed }) => [
              styles.link,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <link.icon size={12} color={theme.textSecondary} />
            <ThemedText type="label" themeColor="textSecondary">
              {link.handle}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ChannelVideoGrid({
  videos,
  onOpen,
  emptyLabel,
}: {
  videos: ChannelVideo[];
  onOpen: (video: ChannelVideo) => void;
  emptyLabel: string;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width, 900) - Spacing.three * 2 - Spacing.three) / 2;

  if (videos.length === 0) return <ChannelEmpty label={emptyLabel} />;

  return (
    <View style={styles.grid}>
      {videos.map((video) => (
        <ChannelVideoCard
          key={video.id}
          video={video}
          width={cardWidth}
          onPress={() => onOpen(video)}
        />
      ))}
    </View>
  );
}

export function ChannelVideoList({
  videos,
  onOpen,
  emptyLabel,
}: {
  videos: ChannelVideo[];
  onOpen: (video: ChannelVideo) => void;
  emptyLabel: string;
}) {
  if (videos.length === 0) return <ChannelEmpty label={emptyLabel} />;

  return (
    <View style={styles.list}>
      {videos.map((video) => (
        <ChannelVideoRow key={video.id} video={video} onPress={() => onOpen(video)} />
      ))}
    </View>
  );
}

export function StandaloneVideoGrid({
  videos,
  onOpen,
  emptyLabel,
}: {
  videos: StandaloneVideo[];
  onOpen: (video: StandaloneVideo) => void;
  emptyLabel: string;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width, 900) - Spacing.three * 2 - Spacing.three) / 2;

  if (videos.length === 0) return <ChannelEmpty label={emptyLabel} />;

  return (
    <View style={styles.grid}>
      {videos.map((video) => (
        <StandaloneVideoCard
          key={video.id}
          video={video}
          width={cardWidth}
          onPress={() => onOpen(video)}
        />
      ))}
    </View>
  );
}

export function StandaloneVideoList({
  videos,
  onOpen,
  emptyLabel,
  layout = "row",
}: {
  videos: StandaloneVideo[];
  onOpen: (video: StandaloneVideo) => void;
  emptyLabel: string;
  layout?: StandaloneVideoLayout;
}) {
  if (videos.length === 0) return <ChannelEmpty label={emptyLabel} />;

  return (
    <View
      style={
        layout === "feature"
          ? styles.fullBleedList
          : layout === "feed"
            ? styles.videoFeed
            : styles.list
      }>
      {videos.map((video) => (
        <StandaloneVideoRow
          key={video.id}
          video={video}
          layout={layout}
          onPress={() => onOpen(video)}
        />
      ))}
    </View>
  );
}

export function ChannelVideoRail({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {children}
    </ScrollView>
  );
}

export function ChannelFeatured({ video, onPress }: { video: ChannelVideo; onPress: () => void }) {
  return <FeaturedVideo video={video} onPress={onPress} />;
}

export function StandaloneChannelFeatured({
  video,
  onPress,
}: {
  video: StandaloneVideo;
  onPress: () => void;
}) {
  return <FeaturedStandaloneVideo video={video} onPress={onPress} />;
}

export function ChannelEmpty({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <MessageSquare size={20} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export function ChannelStore({ children }: { children: ReactNode }) {
  return <View style={styles.store}>{children}</View>;
}

export function ChannelFeed({ children }: { children: ReactNode }) {
  return <View style={styles.feed}>{children}</View>;
}

export function ChannelSectionTitle({
  children,
  onSeeAll,
}: {
  children: ReactNode;
  onSeeAll?: () => void;
}) {
  const theme = useTheme();

  if (!onSeeAll) {
    return (
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {children}
      </ThemedText>
    );
  }

  return (
    <View style={styles.sectionTitleRow}>
      <ThemedText type="subtitle" style={styles.sectionTitleText}>
        {children}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`See all ${typeof children === "string" ? children : "items"}`}
        onPress={onSeeAll}
        style={({ pressed }) => [styles.seeAll, { opacity: pressed ? 0.6 : 1 }]}>
        <ThemedText type="label" themeColor="brand" style={styles.seeAllLabel}>
          See all
        </ThemedText>
        <ChevronRight size={14} color={theme.brand} />
      </Pressable>
    </View>
  );
}

export function ChannelHairline() {
  const theme = useTheme();
  return <View style={[styles.hairline, { backgroundColor: theme.border }]} />;
}

export type ChannelTabName = (typeof CHANNEL_TABS)[number];

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    height: 40,
    borderRadius: Radius.pill,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  iconAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  actionLabel: {
    color: "#FFFFFF",
  },
  tabBar: {
    flexDirection: "row",
    marginTop: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: Spacing.two,
  },
  tabLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: Spacing.one,
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
    borderRadius: Radius.pill,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    height: 2,
    borderRadius: Radius.pill,
  },
  stats: {
    flexDirection: "row",
    marginHorizontal: Spacing.three,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: Spacing.three,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  about: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bio: {
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  feed: {
    gap: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  videoFeed: {
    gap: Spacing.four,
  },
  fullBleedList: {
    gap: Spacing.four,
  },
  rail: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  store: {
    gap: 0,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
  },
  sectionTitleText: {
    flexShrink: 1,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  seeAllLabel: {
    textTransform: "none",
  },
  hairline: {
    ...Hairline,
    marginTop: Spacing.four,
  },
  empty: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
});
