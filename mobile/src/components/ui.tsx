import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Screen = ({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) => (
  <SafeAreaView className={`flex-1 bg-slate-950 ${padded ? 'px-4' : ''}`} edges={['top', 'left', 'right']}>
    {children}
  </SafeAreaView>
);

export const Title = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-2xl font-bold text-white">{children}</Text>
);

export const Subtitle = ({ children }: { children: React.ReactNode }) => (
  <Text className="mt-1 text-sm text-slate-400">{children}</Text>
);

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}>{children}</View>
);

export const Field = ({
  label,
  ...props
}: TextInputProps & { label: string }) => (
  <View className="mb-3">
    <Text className="mb-2 text-sm text-slate-400">{label}</Text>
    <TextInput
      placeholderTextColor="#64748b"
      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-white"
      {...props}
    />
  </View>
);

export const Button = ({
  title,
  loading,
  variant = 'primary',
  ...props
}: PressableProps & { title: string; loading?: boolean; variant?: 'primary' | 'danger' | 'ghost' }) => {
  const styles = {
    primary: 'bg-indigo-600',
    danger: 'bg-rose-600',
    ghost: 'bg-slate-800',
  }[variant];
  return (
    <Pressable
      disabled={loading || props.disabled}
      className={`items-center rounded-lg px-4 py-3 ${styles} ${loading || props.disabled ? 'opacity-60' : ''}`}
      {...props}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-medium text-white">{title}</Text>}
    </Pressable>
  );
};

export const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`mr-2 rounded-full px-3 py-2 ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}
  >
    <Text className={`text-xs ${active ? 'text-white' : 'text-slate-300'}`}>{label}</Text>
  </Pressable>
);

export const ChipRow = ({ children }: { children: React.ReactNode }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="mb-4 mt-3"
    style={{ flexGrow: 0 }}
    contentContainerStyle={{ alignItems: 'center' }}
  >
    {children}
  </ScrollView>
);

export const ErrorBanner = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-lg border border-rose-500 bg-rose-500/10 p-3">
      <Text className="text-sm text-rose-400">{message}</Text>
    </View>
  );
};

export const EmptyState = ({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) => (
  <View className="items-center px-6 py-10">
    <Ionicons name={icon} size={36} color="#64748b" />
    <Text className="mt-3 text-base font-medium text-white">{title}</Text>
    <Text className="mt-1 text-center text-sm text-slate-400">{body}</Text>
  </View>
);

export const SelectList = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) => (
  <View className="mb-3">
    <Text className="mb-2 text-sm text-slate-400">{label}</Text>
    <View className="flex-row flex-wrap">
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          active={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  </View>
);
