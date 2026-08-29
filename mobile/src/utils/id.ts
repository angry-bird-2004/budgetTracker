import * as Crypto from 'expo-crypto';

export const newClientId = () => {
  try {
    const id = Crypto.randomUUID();
    if (id) return id;
  } catch {
    // Expo Go can miss the native UUID implementation.
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
};
