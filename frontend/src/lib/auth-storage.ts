const TOKEN_KEY = 'promocode-manager-token';

export const getStoredToken = (): string | null =>
  window.localStorage.getItem(TOKEN_KEY);

export const storeToken = (token: string): void => {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.location.href = '/';
};

export const clearStoredToken = (): void => {
  window.localStorage.removeItem(TOKEN_KEY);
};
