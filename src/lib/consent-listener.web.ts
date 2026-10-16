// Web preview: no real listening. The consent sheet shows "Patient said yes / no"
// buttons that feed transcripts in, so both paths can be tested in the browser.

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
