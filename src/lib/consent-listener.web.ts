// Web preview: no real listening, so spoken consent can't be detected in the browser;
// use "Confirm yes manually" there. Listening works in a development build.

export const IS_SIMULATED_LISTENER = true;

export type ListenerHandlers = {
  onTranscript: (text: string) => void;
  onEnd: () => void;
};

export type StartResult = 'started' | 'denied' | 'unavailable';

export function createConsentListener(_handlers: ListenerHandlers) {
  return {
    start: async (): Promise<StartResult> => 'started',
    stop: () => {},
  };
}
