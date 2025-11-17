import googleSheetsService, { Announcement } from "@/lib/googleSheetService";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AnnouncementBoardScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Add try/catch wrapper
    const init = async () => {
      try {
        await loadAnnouncements();
      } catch (error) {
        console.error("Failed to load announcements on mount:", error);
        // Don't crash - just set loading to false
        setLoading(false);
      }
    };

    init();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadAnnouncements(false).catch((err) => {
        console.error("Auto-refresh failed:", err);
      });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadAnnouncements = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const data = await googleSheetsService.fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);

      // Only show alert if this is a user-initiated action
      if (showLoader) {
        Alert.alert(
          "Connection Error",
          "Unable to load announcements. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Force refresh from Google Sheets (bypass cache)
      const data = await googleSheetsService.fetchAnnouncements(true);
      setAnnouncements(data);
    } catch (error) {
      console.error("Error refreshing announcements:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Today
        return `Today at ${date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`;
      } else if (diffDays === 1) {
        // Yesterday
        return `Yesterday at ${date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`;
      } else if (diffDays < 7) {
        // Within a week
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else {
        // Older than a week
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  const renderAnnouncement = ({
    item,
    index,
  }: {
    item: Announcement;
    index: number;
  }) => (
    <View style={[styles.announcementCard, index === 0 && styles.firstCard]}>
      {index === 0 && announcements.length > 0 && (
        <View style={styles.latestBadge}>
          <Text style={styles.latestBadgeText}>NEW</Text>
        </View>
      )}
      <Text style={styles.announcementTitle}>{item.title}</Text>
      <Text style={styles.announcementDescription}>{item.description}</Text>
      <View style={styles.announcementFooter}>
        <Text style={styles.announcementDate}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );

  const ListHeader = () => {
    if (announcements.length === 0) return null;

    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          Pull down to refresh • {announcements.length} announcement
          {announcements.length !== 1 ? "s" : ""}
        </Text>
      </View>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Announcements</Text>
      <Text style={styles.emptyText}>Check back later for updates</Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => onRefresh()}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity onPress={() => onRefresh()} style={styles.syncButton}>
          <Text style={styles.syncButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4FA0" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            announcements.length === 0 && styles.emptyListContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6B4FA0"
              colors={["#6B4FA0"]}
              title="Pull to refresh"
              titleColor="#6B4FA0"
            />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyComponent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
    backgroundColor: "#000000",
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backButtonText: {
    fontSize: 32,
    color: "#F4F2ED",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "CormorantGaramond_700Bold",
    color: "#F4F2ED",
  },
  syncButton: {
    padding: 8,
    width: 44,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 24,
    color: "#F4F2ED",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#8E8E93",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  listHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  listHeaderText: {
    fontSize: 12,
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  announcementCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    position: "relative",
  },
  firstCard: {
    borderColor: "#6B4FA0",
    borderWidth: 1.5,
  },
  latestBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#6B4FA0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    fontSize: 10,
    color: "#F4F2ED",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  announcementTitle: {
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
    color: "#F4F2ED",
    marginBottom: 12,
    lineHeight: 26,
  },
  announcementDescription: {
    fontSize: 15,
    color: "#CBBCA4",
    lineHeight: 22,
    marginBottom: 16,
  },
  announcementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  announcementDate: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
    color: "#F4F2ED",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#6B4FA0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: "#F4F2ED",
    fontSize: 14,
    fontWeight: "600",
  },
});
