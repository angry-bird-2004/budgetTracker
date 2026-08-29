import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSyncStatus } from '../sync/SyncProvider';

export const SyncBanner = () => {
  const { online, syncing, pending, lastError, refresh } = useSyncStatus();

  let label = 'Up to date';
  let tone = 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
  if (!online) {
    label = pending > 0 ? `Offline · ${pending} change${pending === 1 ? '' : 's'} queued` : 'Offline';
    tone = 'bg-amber-500/10 border-amber-500 text-amber-400';
  } else if (syncing) {
    label = pending > 0 ? `Syncing ${pending} change${pending === 1 ? '' : 's'}…` : 'Syncing…';
    tone = 'bg-indigo-500/10 border-indigo-500 text-indigo-300';
  } else if (pending > 0) {
    label = `${pending} change${pending === 1 ? '' : 's'} waiting to sync`;
    tone = 'bg-amber-500/10 border-amber-500 text-amber-400';
  } else if (lastError) {
    label = lastError;
    tone = 'bg-rose-500/10 border-rose-500 text-rose-400';
  }

  return (
    <Pressable onPress={() => refresh()} className={`mb-4 rounded-lg border px-3 py-2 ${tone}`}>
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-xs">{label}</Text>
        <Text className="text-xs opacity-70">Tap to retry</Text>
      </View>
    </Pressable>
  );
};
