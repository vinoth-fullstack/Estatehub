

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};
export const notifySessionExpired = () => onSessionExpired?.();
