// Web preview: browsers have no calendar permission and handle mic/notification
// prompts differently, so the welcome screen shows simulated OS prompts instead.
export type PermissionKind = 'microphone' | 'notifications' | 'calendar';
export type PermissionState = 'undetermined' | 'granted' | 'denied';

export const IS_SIMULATED = true;

export async function getPermission(_kind: PermissionKind): Promise<PermissionState> {
  return 'undetermined';
}

export async function requestPermission(_kind: PermissionKind): Promise<PermissionState> {
  throw new Error('Permissions are simulated on web; use the in-screen prompt.');
}
