import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useAuth } from '@/src/auth/AuthProvider';
import { Button, ErrorBanner, Field, Screen, Title } from '@/src/components/ui';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await register(username.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center">
        <View className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <Title>Create Account</Title>
          <Text className="mb-6 mt-1 text-sm text-slate-400">Same account works on web and mobile.</Text>
          <ErrorBanner message={error} />
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="Your name" />
          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button title={loading ? 'Creating Account...' : 'Register'} loading={loading} onPress={onSubmit} />
          <Text className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/(auth)/login" className="text-indigo-400">
              Sign In
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
