import { Search, X, SearchX } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { CourseListItem } from "@/components/course-list-item";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { COURSES } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";

const CATEGORIES = ["All", "Development", "Design", "Business", "Data Science", "Marketing"];

export default function SearchScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();

  const paramCategory =
    typeof params.category === "string" && CATEGORIES.includes(params.category)
      ? params.category
      : undefined;

  const [override, setOverride] = useState<{ base: string | undefined; value: string } | null>(
    null,
  );
  const [query, setQuery] = useState("");

  const category =
    override && override.base === paramCategory ? override.value : (paramCategory ?? "All");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return COURSES.filter((course) => {
      const matchesCategory = category === "All" || course.category === category;
      const matchesQuery =
        trimmed.length === 0 ||
        course.title.toLowerCase().includes(trimmed) ||
        course.instructor.name.toLowerCase().includes(trimmed) ||
        course.category.toLowerCase().includes(trimmed);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const listHeader = (
    <View style={styles.header}>
      <ThemedText type="title">Search</ThemedText>

      <View style={[styles.searchField, { backgroundColor: theme.backgroundElement }]}>
        <Search size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Courses, instructors, topics"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map((item) => {
          const active = item === category;
          return (
            <Pressable
              key={item}
              onPress={() => setOverride({ base: paramCategory, value: item })}
              style={[
                styles.chip,
                { backgroundColor: active ? theme.brand : theme.backgroundElement },
              ]}>
              <ThemedText
                type="smallBold"
                style={active ? styles.chipActiveText : undefined}
                themeColor={active ? "background" : "text"}>
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ThemedText type="small" themeColor="textSecondary">
        {results.length} {results.length === 1 ? "result" : "results"}
      </ThemedText>
    </View>
  );

  return (
    <Screen edges={["top", "left", "right"]}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CourseListItem course={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <SearchX size={40} color={theme.textSecondary} />
            <ThemedText type="heading">No courses found</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Try a different keyword or category.
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Radius.large,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  chipRow: {
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    justifyContent: "center",
  },
  chipActiveText: {
    color: "#FFFFFF",
  },
  separator: {
    height: Spacing.two,
  },
  empty: {
    alignItems: "center",
    gap: Spacing.two,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    textAlign: "center",
  },
});
