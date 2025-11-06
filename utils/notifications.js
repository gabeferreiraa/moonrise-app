import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions() {
  let permissionStatus;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  permissionStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    permissionStatus = status;
  }

  return permissionStatus;
}

// Schedule daily notification at 7pm local time
export async function scheduleDailyReminder() {
  // Cancel any existing notifications first
  await cancelAllNotifications();

  // Calculate time until 7pm today or tomorrow
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(19, 0, 0, 0); // 7pm

  // If it's already past 7pm today, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const trigger = {
    hour: 19,
    minute: 0,
    repeats: true,
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Set Your Intention 🌙",
      body: "Come set your intention for tonight's Moonrise",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  return notificationId;
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications (useful for debugging)
export async function getScheduledNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications;
}
