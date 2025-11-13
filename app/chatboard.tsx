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
    loadAnnouncements();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadAnnouncements(false);
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
    <View style={styles.announcementCard}>
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        {index === 0 && announcements.length > 0 && (
          <View style={styles.newIndicator} />
        )}
      </View>
      <Text style={styles.announcementDescription}>{item.description}</Text>
      <Text style={styles.announcementDate}>{formatDate(item.created_at)}</Text>
    </View>
  );

  const ListHeader = () => {
    return null;
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Announcements</Text>
      <Text style={styles.emptyText}>Check back later for updates</Text>
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
          <ActivityIndicator size="large" color="#DEC4A1" />
          <Text style={styles.loadingText}>Loading...</Text>
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
              tintColor="#DEC4A1"
              colors={["#DEC4A1"]}
              title="Pull to refresh"
              titleColor="#DEC4A1"
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
    backgroundColor: "#0C0C0C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DEC4A1",
    backgroundColor: "#0C0C0C",
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backButtonText: {
    fontSize: 28,
    color: "#DEC4A1",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Lora_400Regular",
    color: "#E6D2B5",
  },
  syncButton: {
    padding: 8,
    width: 44,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 24,
    color: "#DEC4A1",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0C0C0C",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flex: 1,
  },
  listHeader: {
    paddingBottom: 16,
    alignItems: "center",
  },
  listHeaderText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
    letterSpacing: 1,
  },
  announcementCard: {
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DEC4A1",
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 22,
    fontFamily: "Lora_400Regular",
    color: "#E6D2B5",
    flex: 1,
    lineHeight: 28,
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFECCC",
    marginLeft: 8,
  },
  announcementDescription: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
    lineHeight: 24,
    marginBottom: 12,
  },
  announcementDate: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: "#8E8E93",
    fontStyle: "italic",
  },
  separator: {
    height: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Spectral_700Bold",
    color: "#E6D2B5",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
  },
});
