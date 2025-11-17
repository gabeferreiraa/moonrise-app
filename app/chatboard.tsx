import googleSheetsService, { Announcement } from "@/lib/googleSheetService";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
    <View style={styles.messageWrapper}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>📢</Text>
      </View>
      <View style={styles.messageBubbleContainer}>
        <View style={styles.announcementCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>Moonrise Team</Text>
            {index === 0 && announcements.length > 0 && (
              <View style={styles.newIndicator}>
                <Text style={styles.newIndicatorText}>NEW</Text>
              </View>
            )}
          </View>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementDescription}>{item.description}</Text>
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={styles.announcementImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.announcementDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );

  const ListHeader = () => {
    return null;
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBubble}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>Check back later for updates</Text>
      </View>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSubtitle}>
            {announcements.length}{" "}
            {announcements.length === 1 ? "message" : "messages"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onRefresh()} style={styles.syncButton}>
          <Text style={styles.syncButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="large" color="#DEC4A1" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#0C0C0C",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(222, 196, 161, 0.1)",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(222, 196, 161, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#DEC4A1",
    fontWeight: "300",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    color: "#E6D2B5",
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: "#8E8E93",
    marginTop: 2,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(222, 196, 161, 0.1)",
    justifyContent: "center",
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
    padding: 20,
  },
  loadingBubble: {
    backgroundColor: "rgba(222, 196, 161, 0.08)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(222, 196, 161, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "rgba(222, 196, 161, 0.2)",
  },
  avatarText: {
    fontSize: 20,
  },
  messageBubbleContainer: {
    flex: 1,
  },
  announcementCard: {
    backgroundColor: "rgba(222, 196, 161, 0.08)",
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(222, 196, 161, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: "#DEC4A1",
    fontWeight: "600",
  },
  announcementTitle: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    color: "#E6D2B5",
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: 8,
  },
  newIndicator: {
    backgroundColor: "#DEC4A1",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newIndicatorText: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    color: "#0C0C0C",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  announcementDescription: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
    lineHeight: 22,
    marginBottom: 10,
  },
  announcementImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "rgba(222, 196, 161, 0.05)",
  },
  announcementDate: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: "#8E8E93",
    fontStyle: "italic",
    alignSelf: "flex-end",
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
  emptyBubble: {
    backgroundColor: "rgba(222, 196, 161, 0.08)",
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(222, 196, 161, 0.15)",
    maxWidth: 280,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Spectral_700Bold",
    color: "#E6D2B5",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: "#CBBCA4",
    textAlign: "center",
  },
});
