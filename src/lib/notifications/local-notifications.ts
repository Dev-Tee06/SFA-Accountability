import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export async function scheduleLocalNotifications(schedules: {
  prayerTime?: string, 
  bibleStudyTime?: string, 
  prayerEnabled?: boolean, 
  bibleStudyEnabled?: boolean 
}) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Local notifications are only scheduled on native mobile platforms.')
    return { success: false, reason: 'not_native' }
  }

  try {
    const permStatus = await LocalNotifications.requestPermissions()
    if (permStatus.display !== 'granted') {
      return { success: false, reason: 'permission_denied' }
    }

    // Cancel all previously scheduled notifications
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending)
    }

    const notificationsToSchedule = []

    if (schedules.prayerEnabled !== false && schedules.prayerTime) {
      const [hour, minute] = schedules.prayerTime.split(':').map(Number)
      if (!isNaN(hour) && !isNaN(minute)) {
        notificationsToSchedule.push({
          title: 'Prayer Time',
          body: 'It is time for your scheduled prayer. Take a moment to pray and stay accountable.',
          id: 1,
          schedule: { on: { hour, minute } },
          smallIcon: 'ic_stat_icon_config_sample' // Optional custom icon if configured
        })
      }
    }

    if (schedules.bibleStudyEnabled !== false && schedules.bibleStudyTime) {
      const [hour, minute] = schedules.bibleStudyTime.split(':').map(Number)
      if (!isNaN(hour) && !isNaN(minute)) {
        notificationsToSchedule.push({
          title: 'Bible Study Time',
          body: 'Your scheduled Bible study time has arrived. Time to dive into the Word.',
          id: 2,
          schedule: { on: { hour, minute } },
          smallIcon: 'ic_stat_icon_config_sample'
        })
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error scheduling local notifications', error)
    return { success: false, error }
  }
}
