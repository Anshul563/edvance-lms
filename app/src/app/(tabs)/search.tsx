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
  const [focused, setFocused] = useState(false);

  const category =
    override && override.base === paramCategory ? override.value : (paramCategory ?? "All");

  const isFiltered = query.trim().length > 0 || category !== "All";

  const clearFilters = () => {
    setQuery("");
    setOverride({ base: paramCategory, value: "All" });
  };

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

      <View
        style={[
          styles.searchField,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: focused ? theme.brand : "transparent",
          },
        ]}>
        <Search size={18} color={focused ? theme.brand : theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Courses, instructors, topics"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search courses"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery("")}
            hitSlop={8}
            style={styles.clearButton}>
            <X size={16} color={theme.textSecondary} />
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
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item} category`}
              onPress={() => setOverride({ base: paramCategory, value: item })}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? theme.brand : theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
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

      <View style={styles.resultRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {results.length} {results.length === 1 ? "result" : "results"}
        </ThemedText>
        {isFiltered ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search filters"
            onPress={clearFilters}
            hitSlop={8}
            style={styles.clearFilters}>
            <ThemedText type="smallBold" themeColor="brand">
              Clear
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
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
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
              <SearchX size={28} color={theme.textSecondary} />
            </View>
            <ThemedText type="heading">No courses found</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Try a different keyword or category.
            </ThemedText>
            {isFiltered ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search filters"
                onPress={clearFilters}
                style={({ pressed }) => [
                  styles.emptyButton,
                  { backgroundColor: theme.brand, opacity: pressed ? 0.8 : 1 },
                ]}>
                <ThemedText type="smallBold" style={styles.chipActiveText}>
                  Clear search
                </ThemedText>
              </Pressable>
            ) : null}
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
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
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
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearFilters: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
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
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    marginBottom: Spacing.one,
  },
  emptyButton: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  emptyText: {
    textAlign: "center",
  },
});
