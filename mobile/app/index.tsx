import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/src/auth/AuthProvider';

export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }
  return <Redirect href={user ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
