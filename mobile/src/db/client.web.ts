const unavailable = () => {
  throw new Error('SQLite is available on iOS and Android. Open this project in Expo Go.');
};

export const getSqlite = unavailable;
export const getDb = unavailable;

export const initDatabase = async () => {
  return {} as ReturnType<typeof unavailable>;
};

export const clearLocalDatabase = async () => {
  // Web is only used for Metro's bundler, not as a client.
};
