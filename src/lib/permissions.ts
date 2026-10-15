import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
// The legacy entry point works in Expo Go; the default ("next") API throws there.
import { getCalendarPermissionsAsync, requestCalendarPermissionsAsync } from 'expo-calendar/legacy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PermissionKind = 'microphone' | 'notifications' | 'calendar';
export type PermissionState = 'undetermined' | 'granted' | 'denied';

/** On native the OS shows the real prompts; only the web preview simulates them. */
export const IS_SIMULATED = false;

type Response = { granted: boolean; status: string };

function toState({ granted, status }: Response): PermissionState {
  if (granted) return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

export async function getPermission(kind: PermissionKind): Promise<PermissionState> {
  switch (kind) {
    case 'microphone':
      return toState(await getRecordingPermissionsAsync());
    case 'notifications':
      return toState(await Notifications.getPermissionsAsync());
    case 'calendar':
      return toState(await getCalendarPermissionsAsync());
  }
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  switch (kind) {
    case 'microphone':
      return toState(await requestRecordingPermissionsAsync());
    case 'notifications':
      // Android 13+ only shows the prompt once a notification channel exists.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      return toState(await Notifications.requestPermissionsAsync());
    case 'calendar':
      return toState(await requestCalendarPermissionsAsync());
  }
}
