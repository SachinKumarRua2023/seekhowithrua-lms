// mobile/src/pages/Courses.tsx
// SeekhoWithRua Courses - LMS functionality for mobile

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { lmsAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS, SPACING, RADIUS, FONTS } from "../constants/theme";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  icon: string;
  is_paid: boolean;
  course_fee: number;
  is_active: boolean;
}

interface EnrolledCourse extends Course {
  enrollment_id: number;
  enrolled_at: string;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function Courses() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const [allRes, dashboardRes] = await Promise.all([
        lmsAPI.getCourses(),
        lmsAPI.getStudentDashboard().catch(() => null),
      ]);
      
      setCourses(allRes.data || []);
      
      if (dashboardRes?.data?.enrolled_courses) {
        setMyCourses(dashboardRes.data.enrolled_courses);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      Alert.alert("Error", "Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId: number) => {
    if (!user) {
      Alert.alert("Login Required", "Please login to enroll in courses.");
      navigation.navigate("Login");
      return;
    }

    setEnrollingId(courseId);
    try {
      await lmsAPI.enrollCourse(courseId);
      Alert.alert("Success", "Successfully enrolled in the course!");
      fetchCourses();
    } catch (error: any) {
      Alert.alert(
        "Enrollment Failed",
        error.response?.data?.error || "Failed to enroll. Please try again."
      );
    } finally {
      setEnrollingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      python: "🐍",
      javascript: "⚡",
      react: "⚛️",
      ml: "🧠",
      ai: "🤖",
      data: "📊",
      web: "🌐",
      mobile: "📱",
    };
    return icons[category.toLowerCase()] || "📚";
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "#22c55e",
      intermediate: "#f59e0b",
      advanced: "#ef4444",
    };
    return colors[level.toLowerCase()] || COLORS.primary;
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const isEnrolled = myCourses.some((c) => c.id === item.id);
    
    return (
      <View style={styles.courseCard}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseIcon}>{getCategoryIcon(item.category)}</Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(item.level) },
              ]}
            >
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
            {item.is_paid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>₹{item.course_fee}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseDesc} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.courseFooter}>
          {isEnrolled ? (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ Enrolled</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.enrollButton,
                enrollingId === item.id && styles.enrollingButton,
              ]}
              onPress={() => handleEnroll(item.id)}
              disabled={enrollingId === item.id}
            >
              {enrollingId === item.id ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.enrollButtonText}>
                  {item.is_paid ? "Enroll Now" : "Free Enroll"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMyCourseCard = ({ item }: { item: EnrolledCourse }) => (
    <TouchableOpacity
      style={styles.myCourseCard}
      onPress={() => navigation.navigate("CourseDetail", { courseId: item.id })}
    >
      <Text style={styles.courseIconLarge}>{getCategoryIcon(item.category)}</Text>
      <View style={styles.myCourseInfo}>
        <Text style={styles.myCourseTitle}>{item.title}</Text>
        <Text style={styles.myCourseLevel}>{item.level}</Text>
        <Text style={styles.enrolledDate}>
          Enrolled: {new Date(item.enrolled_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.arrowIcon}>→</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  const displayCourses = activeTab === "all" ? courses : myCourses;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎓 SeekhoWithRua</Text>
        <Text style={styles.headerSubtitle}>Master the Future</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            All Courses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.activeTab]}
          onPress={() => setActiveTab("my")}
        >
          <Text style={[styles.tabText, activeTab === "my" && styles.activeTabText]}>
            My Courses ({myCourses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Course List */}
      {activeTab === "all" ? (
        <FlatList
          data={courses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No courses available</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={myCourses}
          renderItem={renderMyCourseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                You haven't enrolled in any courses yet.
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => setActiveTab("all")}
              >
                <Text style={styles.browseButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary + "cc",
    marginTop: SPACING.xs,
  },
  tabContainer: {
    flexDirection: "row",
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  activeTabText: {
    color: COLORS.textPrimary,
  },
  listContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  courseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  courseIcon: {
    fontSize: 32,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  levelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  levelText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  paidBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  paidText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  courseTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  courseDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  courseFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  enrollButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 120,
    alignItems: "center",
  },
  enrollingButton: {
    opacity: 0.7,
  },
  enrollButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
  enrolledBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  enrolledText: {
    color: COLORS.success,
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
  myCourseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  courseIconLarge: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  myCourseInfo: {
    flex: 1,
  },
  myCourseTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  myCourseLevel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  enrolledDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  arrowIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  browseButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONTS.sizes.md,
  },
});
