import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";

interface NotificationManagerProps {
  children: React.ReactNode;
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response:", response);

        const data = response.notification.request.content.data;
        if (data?.screen === "intention") {
          router.push("/intention");
        }
      }
    );

    return () => {
      notificationListener.current && 
        Notifications.removeNotificationSubscription(notificationListener.current);
      
      responseListener.current && 
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return <>{children}</>;
}