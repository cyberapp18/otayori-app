const IMAGE_RETENTION_KEY = 'otayori-pon-image-retention';

export const getImageRetention = (): boolean => {
  const storedValue = localStorage.getItem(IMAGE_RETENTION_KEY);
  // Default to false if not set
  return storedValue === 'true';
};

export const setImageRetention = (isEnabled: boolean): void => {
  localStorage.setItem(IMAGE_RETENTION_KEY, String(isEnabled));
};
