import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useAuth } from '@/src/auth/AuthProvider';
import { SyncBanner } from '@/src/components/SyncBanner';
import { Button, Card, Chip, ChipRow, Screen, Title } from '@/src/components/ui';
import { saveSettings } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';

const PAGE_SIZES = [10, 25, 50, 100];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const settings = useBudgetStore((state) => state.settings);
  const [pageSize, setPageSize] = useState(settings.transactionPageSize);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageSize(settings.transactionPageSize);
  }, [settings.transactionPageSize]);

  const dirty = pageSize !== settings.transactionPageSize;

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ transactionPageSize: pageSize });
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Log out', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <Title>Settings</Title>
      <Text className="mt-1 text-sm text-slate-400">{user?.email}</Text>
      <View className="mt-4">
        <SyncBanner />
      </View>

      <Card className="mb-4">
        <Text className="mb-3 font-medium text-white">Transaction page size</Text>
        <ChipRow>
          {PAGE_SIZES.map((size) => (
            <Chip key={size} label={String(size)} active={pageSize === size} onPress={() => setPageSize(size)} />
          ))}
        </ChipRow>
        <Button title="Save" loading={saving} disabled={!dirty || saving} onPress={onSave} />
      </Card>

      <Button title="Log out" variant="danger" onPress={onLogout} />
    </Screen>
  );
}
