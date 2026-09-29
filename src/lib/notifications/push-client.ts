import { createClient } from '@/utils/supabase/client'

// Utility function to convert Base64URL string to Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId: string) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported by this browser.');
    }

    // Ensure permission is granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied.');
      }
    }

    const registration = await navigator.serviceWorker.ready;
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicVapidKey) {
      throw new Error('VAPID public key is missing from environment variables.');
    }

    // Subscribe to the push service
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Determine platform roughly
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'web';

    const supabase = createClient();
    
    // Check if subscription already exists for this endpoint
    const { data: existingSub } = await supabase
      .from('notification_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existingSub) {
      // Update existing
      await supabase
        .from('notification_subscriptions')
        .update({
          subscription_data: JSON.parse(JSON.stringify(subscription)),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
    } else {
      // Insert new
      await supabase
        .from('notification_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          subscription_data: JSON.parse(JSON.stringify(subscription)),
          platform
        });
    }

    // Upsert notification preferences to enable them
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        push_enabled: true,
        prayer_enabled: true,
        bible_study_enabled: true
      }, { onConflict: 'user_id' });

    return { success: true };
  } catch (error: any) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: error.message };
  }
}
