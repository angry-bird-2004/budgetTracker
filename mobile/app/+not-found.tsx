import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-lg font-semibold text-white">Screen not found</Text>
        <Link href="/" className="mt-4 text-indigo-400">
          Go home
        </Link>
      </View>
    </>
  );
}
