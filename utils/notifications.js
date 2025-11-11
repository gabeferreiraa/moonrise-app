import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask for notification permissions and set Android channel
export async function requestNotificationPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return existingStatus;

  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

// Schedule a daily notification at 7:00 PM
export async function scheduleDailyReminder() {
  try {
    await cancelAllNotifications();

    const baseTrigger = {
      hour: 19,
      minute: 0,
      repeats: true,
      ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Set Your Intention 🌙",
        body: "Come set your intention for tonight's Moonrise",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: "intention", params: { ref: "notif_daily" } },
      },
      trigger: baseTrigger,
    });

    console.log("Scheduled notification with ID:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling daily reminder:", error);

    try {
      const fallbackTrigger = {
        seconds: 60 * 60 * 24,
        repeats: true,
        ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
      };

      const fallbackId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Set Your Intention 🌙",
          body: "Come set your intention for tonight's Moonrise",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: "intention", params: { ref: "notif_fallback" } },
        },
        trigger: fallbackTrigger,
      });

      return fallbackId;
    } catch (fallbackError) {
      console.error("Fallback scheduling also failed:", fallbackError);
      throw fallbackError;
    }
  }
}

// Schedule a test notification
export async function scheduleTestNotification(secondsFromNow = 10) {
  const trigger = {
    seconds: secondsFromNow,
    repeats: false,
    ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 🌙",
      body: "This is a test notification from Moonrise",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { screen: "intention", params: { ref: "notif_test" } },
    },
    trigger,
  });

  console.log(`Test notification scheduled in ${secondsFromNow}s`);
  return id;
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Cancel a specific notification
export async function cancelNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Check if notifications are enabled
export async function areNotificationsEnabled() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
