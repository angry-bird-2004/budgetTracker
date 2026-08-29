import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PATH = 'http://localhost:5001/api';
const LAN_HOST = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;

const expoLanHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  return host && LAN_HOST.test(host) ? host : null;
};

export const getApiUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL || DEFAULT_PATH;
  const lanHost = expoLanHost();

  if (lanHost) {
    return fromEnv
      .replace('localhost', lanHost)
      .replace('127.0.0.1', lanHost)
      .replace('10.0.2.2', lanHost);
  }

  if (Platform.OS === 'android') {
    return fromEnv.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return fromEnv;
};
