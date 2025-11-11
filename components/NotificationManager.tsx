import {
  requestNotificationPermissions,
  scheduleDailyReminder,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Alert, Linking } from "react-native";

const NOTIFICATION_PERMISSION_KEY = "@moonrise_notification_permission";
const NOTIFICATION_SCHEDULED_KEY = "@moonrise_notification_scheduled";

interface NotificationManagerProps {
  children: React.ReactNode;
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    setupNotifications();

    // Listen to incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Listen to notification interactions (user taps on notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);

        const data = response.notification.request.content.data;
        if (data?.screen === "intention") {
          router.push("/intention");
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Check if we've already asked for permission
      const hasAskedPermission = await AsyncStorage.getItem(
        NOTIFICATION_PERMISSION_KEY
      );
      const hasScheduled = await AsyncStorage.getItem(
        NOTIFICATION_SCHEDULED_KEY
      );

      if (!hasAskedPermission) {
        // First time setup - ask for permission
        const permissionStatus = await requestNotificationPermissions();
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "true");

        if (permissionStatus === "granted") {
          // Schedule the daily reminder
          await scheduleDailyReminder();
          await AsyncStorage.setItem(NOTIFICATION_SCHEDULED_KEY, "true");
        } else {
          // Handle permission denied
          console.log("Notification permission denied");
          Alert.alert(
            "Enable Notifications",
            "Enable notifications to receive daily reminders to set your intention. You can change this in Settings.",
            [
              { text: "OK" },
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ]
          );
        }
      } else if (!hasScheduled) {
        // Permission was granted before but notifications weren't scheduled
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          await scheduleDailyReminder();
          await AsyncStorage.setItem(NOTIFICATION_SCHEDULED_KEY, "true");
        }
      }

      // Verify notifications are scheduled (for debugging)
      if (__DEV__) {
        const scheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        console.log("Scheduled notifications:", scheduled);
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  return <>{children}</>;
}
