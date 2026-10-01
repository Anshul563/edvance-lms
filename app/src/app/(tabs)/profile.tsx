import { Award, Calendar, Clock, Flame, GraduationCap, Mail, AtSign, Ribbon } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";

import { AchievementBadge } from "@/components/achievement-badge";
import { ActivityWeek } from "@/components/activity-week";
import { Screen } from "@/components/screen";
import { Section } from "@/components/section";
import { SettingsRow } from "@/components/settings-row";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import {
  ACHIEVEMENTS,
  CERTIFICATES,
  PROFILE,
  formatDate,
  formatMonthYear,
  getInitials,
} from "@/data/profile";
import { useTheme } from "@/hooks/use-theme";
import type { IconName } from "@/types/profile";

export default function ProfileScreen() {
  const theme = useTheme();
  const initials = getInitials(PROFILE.firstName, PROFILE.lastName);

  const stats: { icon: IconName; label: string; value: string }[] = [
    { icon: GraduationCap, label: "Courses", value: `${PROFILE.coursesCompleted}` },
    { icon: Clock, label: "Hours", value: `${PROFILE.hoursLearned}` },
    { icon: Award, label: "Badges", value: `${ACHIEVEMENTS.filter((item) => item.earned).length}` },
    { icon: Flame, label: "Streak", value: `${PROFILE.streakDays}d` },
  ];

  const account = [
    { icon: AtSign, label: "Username", value: `@${PROFILE.username}` },
    { icon: Mail, label: "Email", value: PROFILE.email },
    { icon: Calendar, label: "Member since", value: formatMonthYear(PROFILE.joinedAt) },
  ];

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="subtitle" themeColor="brand">
                {initials}
              </ThemedText>
            </View>

            <View style={styles.identityText}>
              <ThemedText type="title" numberOfLines={1}>
                {PROFILE.firstName} {PROFILE.lastName}
              </ThemedText>
              <View style={styles.handleRow}>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  @{PROFILE.username}
                </ThemedText>
                <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
                  <ThemedText type="label" themeColor="brand">
                    {PROFILE.plan}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                Member since {formatMonthYear(PROFILE.joinedAt)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {PROFILE.bio}
          </ThemedText>
        </View>

        <View style={[styles.statsStrip, { backgroundColor: theme.backgroundElement }]}>
          {stats.map((stat, index) => {
            const StatIcon = stat.icon;
            return (
              <View
                key={stat.label}
                style={[
                  styles.statCell,
                  index < stats.length - 1
                    ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }
                    : null,
                ]}>
                <StatIcon size={16} color={theme.brand} />
                <ThemedText type="smallBold">{stat.value}</ThemedText>
                <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
                  {stat.label}
                </ThemedText>
              </View>
            );
          })}
        </View>

        <ActivityWeek week={PROFILE.week} />

        <Section title="Achievements">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}>
            {ACHIEVEMENTS.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </ScrollView>
        </Section>

        <Section title="Certificates">
          <View style={styles.list}>
            {CERTIFICATES.map((certificate) => (
              <View
                key={certificate.id}
                style={[styles.certificate, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.certificateIcon, { backgroundColor: theme.brandMuted }]}>
                  <Ribbon size={18} color={theme.brand} />
                </View>

                <View style={styles.certificateBody}>
                  <ThemedText type="smallBold" numberOfLines={2}>
                    {certificate.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    Issued {formatDate(certificate.issuedAt)}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
                    {certificate.credentialId}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Account">
          <View style={styles.list}>
            {account.map((row) => (
              <SettingsRow key={row.label} {...row} />
            ))}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  identityText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  handleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.large,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: Spacing.one,
  },
  cardRow: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  certificate: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.large,
  },
  certificateIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
  },
  certificateBody: {
    flex: 1,
    gap: 2,
  },
});
