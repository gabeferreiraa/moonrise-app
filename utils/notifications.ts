import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Notification handler
Notifications.setNotificationHandler({
  handleNotification:
    async (): Promise<Notifications.NotificationBehavior> => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: false,
    }),
});

// Your 7 rotating messages — edit these however you want!
const DAILY_INTENTION_MESSAGES = [
  {
    title: "Moonrise Experience",
    body: "New week, new energy. What will you create today?",
  },
  {
    title: "Moonrise Experience",
    body: "Trust the rhythm of your breath and your day.",
  },
  {
    title: "Moonrise Experience",
    body: "You are exactly where you need to be. Keep going.",
  },
  {
    title: "Moonrise Experience",
    body: "One day closer to your dreams. Feel that?",
  },
  {
    title: "Moonrise Experience",
    body: "Let go of what no longer serves you tonight.",
  },
  {
    title: "Moonrise Experience",
    body: "Rest deeply. You’ve earned this peace.",
  },
  {
    title: "Moonrise Experience",
    body: "Tomorrow is new. Tonight, just be.",
  },
] as const; // Makes it readonly + better typing

export type ScheduledReminder = {
  config: {
    hour: number;
    minute: number;
    title: string;
    body: string;
    data?: any;
  };
  ids: string[];
};

// Permissions (unchanged)
export async function requestNotificationPermissions(): Promise<string> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "Daily Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
      enableVibrate: true,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus;
  }
  return status;
}

// MAIN FUNCTION: Schedule 7 different messages — one per weekday at 7 PM
export async function scheduleRotatingDailyReminders(): Promise<
  ScheduledReminder[]
> {
  await cancelAllNotifications(); // Clear old ones

  const results: ScheduledReminder[] = [];

  for (let weekday = 1; weekday <= 7; weekday++) {
    const message = DAILY_INTENTION_MESSAGES[weekday - 1]; // weekday 1 = index 0

    const content: Notifications.NotificationContentInput = {
      title: message.title,
      body: message.body,
      sound: true,
      data: {
        screen: "intention",
        params: { ref: "notif_rotating", day: weekday },
      },
    };

    const trigger: Notifications.WeeklyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: 23, // 11:00 PM CHANGE BACK TO 7:00 PM AFTER
      minute: 0,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
      ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
    });

    console.log(
      `Scheduled: ${message.title} → Every ${getDayName(weekday)} at 7:00 PM`
    );
    results.push({
      config: { hour: 19, minute: 0, title: message.title, body: message.body },
      ids: [id], // Only one ID per day now
    });
  }

  return results;
}

// Helper to debug
function getDayName(weekday: number): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][weekday - 1];
}

// Keep your old single one if you want fallback
export async function scheduleDailyReminder(): Promise<string[]> {
  await scheduleRotatingDailyReminders();
  return []; // We don't return IDs here anymore — but function stays compatible
}

// Utilities
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
