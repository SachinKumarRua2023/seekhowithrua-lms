// mobile/src/pages/StudentDashboard.tsx
// Student Dashboard - Shows enrolled courses, attendance, payments, progress

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { lmsAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { COLORS, SPACING, RADIUS, FONTS } from "../constants/theme";

interface DashboardData {
  enrolled_courses: Array<{
    id: number;
    title: string;
    category: string;
    progress: number;
  }>;
  attendance_stats: {
    total_sessions: number;
    attended: number;
    percentage: number;
  };
  payment_stats: {
    total_paid: number;
    total_due: number;
  };
  upcoming_sessions: Array<{
    id: number;
    course_title: string;
    session_date: string;
    start_time: string;
  }>;
}

export default function StudentDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await lmsAPI.getStudentDashboard();
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const attendancePercent = data.attendance_stats?.percentage || 0;
  const attendanceColor = attendancePercent >= 75 ? COLORS.success : attendancePercent >= 50 ? COLORS.warning : COLORS.error;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎓 My Learning</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {user?.first_name || user?.username}!</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.enrolled_courses?.length || 0}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={[styles.statCard, { borderColor: attendanceColor }]}>
          <Text style={[styles.statNumber, { color: attendanceColor }]}>
            {Math.round(attendancePercent)}%
          </Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹{data.payment_stats?.total_paid || 0}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
      </View>

      {/* My Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 My Courses</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Courses")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {data.enrolled_courses?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No enrolled courses yet</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate("Courses")}
            >
              <Text style={styles.browseText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data.enrolled_courses?.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <Text style={styles.courseIcon}>{getCategoryIcon(course.category)}</Text>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${course.progress || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>{course.progress || 0}% complete</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Upcoming Sessions</Text>
        {data.upcoming_sessions?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming sessions</Text>
          </View>
        ) : (
          data.upcoming_sessions?.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionDate}>
                <Text style={styles.sessionDay}>
                  {new Date(session.session_date).getDate()}
                </Text>
                <Text style={styles.sessionMonth}>
                  {new Date(session.session_date).toLocaleString("default", { month: "short" })}
                </Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionCourse}>{session.course_title}</Text>
                <Text style={styles.sessionTime}>🕐 {session.start_time}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Attendance Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Attendance Summary</Text>
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceLabel}>Total Sessions</Text>
            <Text style={styles.attendanceValue}>{data.attendance_stats?.total_sessions || 0}</Text>
          </View>
          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceLabel}>Attended</Text>
            <Text style={[styles.attendanceValue, { color: COLORS.success }]}>
              {data.attendance_stats?.attended || 0}
            </Text>
          </View>
          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceLabel}>Percentage</Text>
            <Text style={[styles.attendanceValue, { color: attendanceColor }]}>
              {Math.round(attendancePercent)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Summary</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Paid</Text>
            <Text style={[styles.paymentValue, { color: COLORS.success }]}>
              ₹{data.payment_stats?.total_paid || 0}
            </Text>
          </View>
          {data.payment_stats?.total_due > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Due</Text>
              <Text style={[styles.paymentValue, { color: COLORS.error }]}>
                ₹{data.payment_stats?.total_due}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
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
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: "row",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  browseText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  courseIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sessionDate: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    minWidth: 50,
  },
  sessionDay: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  sessionMonth: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  sessionInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  sessionCourse: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  sessionTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  attendanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  attendanceLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  attendanceValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  paymentValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
});
