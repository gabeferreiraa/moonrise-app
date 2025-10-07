import AsyncStorage from "@react-native-async-storage/async-storage";
import { Filter } from "bad-words";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

const REPORT_THRESHOLD = 3;

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

export default function ChatboardScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const filter = new Filter();

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

      // Load blocked users
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
      setLoading(true);
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
      setLoading(false);
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

      // Optimistically add message to UI immediately
      const optimisticMessage = {
        _id: uuidv4(), // Temporary ID
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
        // Remove optimistic message on error
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
      // Insert report record
      await supabase.from("chatboard_reports").insert({
        message_id: messageId,
        reporter_id: userId,
        reason: reason,
      });

      const newReportCount = currentReportCount + 1;

      // Update message
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
      {/* Header */}
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

      {/* Chat */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4FA0" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
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
              ...styles.textInput,
              returnKeyType: "send",
              blurOnSubmit: false,
              enablesReturnKeyAutomatically: true,
            }}
            messagesContainerStyle={styles.messagesContainer}
            bottomOffset={insets.bottom}
            minInputToolbarHeight={44}
          />
        </KeyboardAvoidingView>
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
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
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
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  messagesContainer: {
    backgroundColor: "#000000",
    paddingBottom: 8,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 5,
    gap: 15,
  },
  actionText: {
    color: "#CBBCA4",
    fontSize: 12,
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
  textInput: {
    color: "#F4F2ED",
    fontSize: 16,
    paddingTop: 8,
    paddingHorizontal: 12,
    lineHeight: 20,
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
});
