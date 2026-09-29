import webpush from 'web-push';

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys are not fully configured. Web push notifications will fail.');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushNotificationPayload
) {
  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return { success: true, result };
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return { success: false, expired: true, error };
    }
    return { success: false, expired: false, error };
  }
}
