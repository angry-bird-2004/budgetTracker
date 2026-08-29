import * as Crypto from 'expo-crypto';

export const newClientId = () => Crypto.randomUUID();
