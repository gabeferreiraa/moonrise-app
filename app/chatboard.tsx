import googleSheetsService, { Announcement } from "@/lib/googleSheetService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Filter } from "bad-words";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import "react-native-get-random-values";
import {
  Bubble,
  GiftedChat,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import PagerView from "react-native-pager-view";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

const REPORT_THRESHOLD = 3;
const IDLE_MS = 5000; // Time before page indicator fades out
const DEVA_AVATAR_URI =
  "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/IMG_6681.JPG?alt=media&token=883809be-5cae-43fe-8fad-1a552e28009d";

interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
  };
  reportCount: number;
}

export default function CombinedChatBoardScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showPageIndicator, setShowPageIndicator] = useState(true);
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chatroom state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [chatroomLoading, setChatroomLoading] = useState(true);
  const filter = new Filter();

  // Idle timer for page indicator
  const kickIdle = () => {
    setShowPageIndicator(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowPageIndicator(false);
    }, IDLE_MS);
  };

  useEffect(() => {
    kickIdle();
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ============ ANNOUNCEMENTS LOGIC ============
  useEffect(() => {
    loadAnnouncements();

    const interval = setInterval(() => {
      loadAnnouncements(false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadAnnouncements = async (showLoader = true) => {
    try {
      if (showLoader) setAnnouncementsLoading(true);

      const data = await googleSheetsService.fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);

      if (showLoader) {
        Alert.alert(
          "Connection Error",
          "Unable to load announcements. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      if (showLoader) setAnnouncementsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
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

      if (isNaN(date.getTime())) {
        return dateString;
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Today at ${date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`;
      } else if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`;
      } else if (diffDays < 7) {
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else {
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

  // ============ CHATROOM LOGIC ============
  useEffect(() => {
    initUser();
    loadMessages();
    const unsubscribe = subscribeToMessages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const initUser = async () => {
    try {
      let id = await AsyncStorage.getItem("anonymousChatUserId");

      if (!id) {
        id = uuidv4();
        await AsyncStorage.setItem("anonymousChatUserId", id);
      }

      setUserId(id);
      setUserName(generateUserName(id));

      const blocked = await AsyncStorage.getItem("blockedChatUsers");
      if (blocked) {
        setBlockedUsers(new Set(JSON.parse(blocked)));
      }
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const generateUserName = (id: string): string => {
    const shortId = id.slice(0, 6).toUpperCase();
    return `User ${shortId}`;
  };

  const loadMessages = async () => {
    try {
      setChatroomLoading(true);
      const { data, error } = await supabase
        .from("chatboard_messages")
        .select("*")
        .eq("is_blocked", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedMessages =
        data
          ?.filter((msg) => !blockedUsers.has(msg.user_id))
          .map((msg) => ({
            _id: msg.id,
            text: filter.clean(msg.text),
            createdAt: new Date(msg.created_at),
            user: {
              _id: msg.user_id,
              name: msg.user_name,
            },
            reportCount: msg.report_count,
          })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setChatroomLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel("chatboard_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chatboard_messages",
        },
        (payload) => {
          const newMessage = payload.new;

          if (blockedUsers.has(newMessage.user_id)) return;
          if (newMessage.user_id === userId) return;

          setMessages((prev) => [
            {
              _id: newMessage.id,
              text: newMessage.text,
              createdAt: new Date(newMessage.created_at),
              user: {
                _id: newMessage.user_id,
                name: newMessage.user_name,
              },
              reportCount: newMessage.report_count,
            },
            ...prev,
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chatboard_messages",
        },
        (payload) => {
          const updated = payload.new;

          setMessages((prev) =>
            prev
              .map((msg) =>
                msg._id === updated.id
                  ? { ...msg, reportCount: updated.report_count }
                  : msg
              )
              .filter((msg) => msg._id !== updated.id || !updated.is_blocked)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const onSend = useCallback(
    async (newMessages: ChatMessage[] = []) => {
      if (!userId || !userName) return;

      const message = newMessages[0];

      const optimisticMessage = {
        _id: uuidv4(),
        text: filter.clean(message.text),
        createdAt: new Date(),
        user: {
          _id: userId,
          name: userName,
        },
        reportCount: 0,
      };

      setMessages((prev) => [optimisticMessage, ...prev]);

      try {
        const { error } = await supabase.from("chatboard_messages").insert({
          text: message.text,
          user_id: userId,
          user_name: userName,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) =>
          prev.filter((m) => m._id !== optimisticMessage._id)
        );
        Alert.alert("Error", "Failed to send message");
      }
    },
    [userId, userName]
  );

  const handleReport = (
    messageId: string,
    currentUserId: string,
    reportCount: number
  ) => {
    if (currentUserId === userId) {
      Alert.alert("Cannot Report", "You cannot report your own message");
      return;
    }

    Alert.alert("Report Message", "Why are you reporting this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Spam",
        onPress: () => reportMessage(messageId, reportCount, "spam"),
      },
      {
        text: "Inappropriate",
        onPress: () => reportMessage(messageId, reportCount, "inappropriate"),
      },
      {
        text: "Harmful",
        onPress: () => reportMessage(messageId, reportCount, "harmful"),
      },
    ]);
  };

  const reportMessage = async (
    messageId: string,
    currentReportCount: number,
    reason: string
  ) => {
    try {
      await supabase.from("chatboard_reports").insert({
        message_id: messageId,
        reporter_id: userId,
        reason: reason,
      });

      const newReportCount = currentReportCount + 1;

      const { error } = await supabase
        .from("chatboard_messages")
        .update({
          reported: true,
          report_count: newReportCount,
          is_blocked: newReportCount >= REPORT_THRESHOLD,
        })
        .eq("id", messageId);

      if (error) throw error;

      if (newReportCount >= REPORT_THRESHOLD) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        Alert.alert("Reported", "Message has been removed for review");
      } else {
        Alert.alert("Reported", "Thank you for keeping our community safe");
      }
    } catch (error) {
      console.error("Error reporting message:", error);
      Alert.alert("Error", "Failed to report message");
    }
  };

  const blockUser = async (blockedUserId: string) => {
    try {
      const newBlockedUsers = new Set(blockedUsers);
      newBlockedUsers.add(blockedUserId);
      setBlockedUsers(newBlockedUsers);

      await AsyncStorage.setItem(
        "blockedChatUsers",
        JSON.stringify(Array.from(newBlockedUsers))
      );

      setMessages((prev) =>
        prev.filter((msg) => msg.user._id !== blockedUserId)
      );
      Alert.alert("Blocked", "You will no longer see messages from this user");
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderAnnouncement = ({
    item,
    index,
  }: {
    item: Announcement;
    index: number;
  }) => (
    <View style={styles.messageWrapper}>
      <View style={styles.avatarCircle}>
        <Image
          source={{ uri: DEVA_AVATAR_URI }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.messageBubbleContainer}>
        <View style={styles.announcementCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>Deva Munay</Text>
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

  const EmptyAnnouncementsComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBubble}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>Check back later for updates</Text>
      </View>
    </View>
  );

  const renderBubble = (props: any) => {
    const isCurrentUser = props.currentMessage.user._id === userId;

    return (
      <View>
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: "#6B4FA0",
            },
            left: {
              backgroundColor: "#2C2C2E",
            },
          }}
          textStyle={{
            right: { color: "#F4F2ED" },
            left: { color: "#F4F2ED" },
          }}
        />
        {!isCurrentUser && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              onPress={() =>
                handleReport(
                  props.currentMessage._id,
                  props.currentMessage.user._id,
                  props.currentMessage.reportCount
                )
              }
            >
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => blockUser(props.currentMessage.user._id)}
            >
              <Text style={styles.actionText}>Block User</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </View>
      </Send>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => {
          setCurrentPage(e.nativeEvent.position);
          kickIdle();
        }}
      >
        {/* Page 1: Announcements */}
        <View style={styles.page} key="1">
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
            <TouchableOpacity
              onPress={() => onRefresh()}
              style={styles.syncButton}
            >
              <Text style={styles.syncButtonText}>⟳</Text>
            </TouchableOpacity>
          </View>

          {announcementsLoading ? (
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
              ListEmptyComponent={EmptyAnnouncementsComponent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Page 2: Interactive Chatroom */}
        <View style={styles.page} key="2">
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community Board</Text>
            <View style={styles.placeholder} />
          </View>

          {chatroomLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B4FA0" />
            </View>
          ) : (
            <GiftedChat
              messages={messages}
              onSend={onSend}
              user={{
                _id: userId || "",
                name: userName,
              }}
              renderBubble={renderBubble}
              renderSend={renderSend}
              renderInputToolbar={renderInputToolbar}
              placeholder="Share your thoughts..."
              alwaysShowSend
              renderUsernameOnMessage
              maxInputLength={500}
              textInputProps={{
                returnKeyType: "send",
                blurOnSubmit: false,
                enablesReturnKeyAutomatically: true,
              }}
              messagesContainerStyle={styles.messagesContainer}
              minInputToolbarHeight={44}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </PagerView>

      {/* Page Indicator Dots */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: showPageIndicator ? 1 : 0 }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.pageIndicator}
        pointerEvents="none"
      >
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, currentPage === 0 && styles.dotActive]} />
          <View style={[styles.dot, currentPage === 1 && styles.dotActive]} />
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
  },
  pagerView: {
    flex: 1,
  },
  page: {
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
  placeholder: {
    width: 44,
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
  messagesContainer: {
    backgroundColor: "#0C0C0C",
    paddingBottom: 8,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
    gap: 12,
    flexWrap: "wrap",
  },
  actionText: {
    color: "#CBBCA4",
    fontSize: 11,
  },
  inputToolbar: {
    backgroundColor: "#1C1C1E",
    borderTopColor: "#2C2C2E",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  inputPrimary: {
    alignItems: "center",
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 0,
    marginBottom: 0,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6B4FA0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
  },
  sendButtonText: {
    color: "#F4F2ED",
    fontSize: 16,
    fontWeight: "600",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DEC4A1",
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: "#E6D2B5",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22, // same as avatarCircle radius
  },
});
