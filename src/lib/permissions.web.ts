// Web preview: browsers have no calendar permission and handle mic/notification
// prompts differently, so screens show simulated OS prompts instead
// (`useSimulatedPermissionPrompt`). Answers are remembered for the session so a
// permission granted on Welcome is still granted on Visit Detail.
export type PermissionKind = 'microphone' | 'notifications' | 'calendar';
export type PermissionState = 'undetermined' | 'granted' | 'denied';

export const IS_SIMULATED = true;

const answers: Partial<Record<PermissionKind, PermissionState>> = {};

export function rememberSimulated(kind: PermissionKind, state: PermissionState) {
  answers[kind] = state;
}

export async function getPermission(kind: PermissionKind): Promise<PermissionState> {
  return answers[kind] ?? 'undetermined';
}

export async function requestPermission(_kind: PermissionKind): Promise<PermissionState> {
  throw new Error('Permissions are simulated on web; use useSimulatedPermissionPrompt().');
}
