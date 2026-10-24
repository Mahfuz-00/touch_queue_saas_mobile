import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';

import { Badge, Button, Card, Notice, Screen } from '@/components/ui';
import { useGuestInit, useServices } from '@/controllers/guest';
import type { Service } from '@/models/types';
import type { RootStackParamList } from '@/navigation';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Services'>;

/**
 * The service list, i.e. screen one of the guest journey.
 *
 * Rows are memoised and keyed by id so a background poll refreshing the list
 * does not re-render every row on a cheap phone.
 */
const ServiceRow = memo(function ServiceRow({
  service,
  showSecondary,
  onPress,
}: {
  service: Service;
  showSecondary: boolean;
  onPress: (service: Service) => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(service)}>
      <Card className="mt-3">
        <Text className="text-base font-semibold text-black">{service.name_en}</Text>
        {showSecondary && service.name_secondary ? (
          <Text className="mt-1 text-sm text-muted">{service.name_secondary}</Text>
        ) : null}
        {service.provider_name_en ? (
          <Text className="mt-1 text-xs text-muted">{service.provider_name_en}</Text>
        ) : null}
      </Card>
    </Pressable>
  );
});

export function ServicesScreen({ navigation }: Props) {
  const { data: init } = useGuestInit();
  const { data: services, isLoading, error, refetch, isRefetching } = useServices();
  const tenant = useSession((state) => state.tenant);
  const ticketKey = useSession((state) => state.ticketKey);

  const open = useCallback(
    (service: Service) => navigation.navigate('Confirm', { service }),
    [navigation],
  );

  return (
    <Screen>
      <View className="flex-row items-center gap-3 pt-4">
        {init?.branding.logo_url ? (
          <Image source={{ uri: init.branding.logo_url }} style={{ width: 44, height: 44, borderRadius: 10 }} />
        ) : null}
        <View className="flex-1">
          <Text className="text-lg font-bold text-primary">{init?.branding.name ?? tenant?.name ?? 'Welcome'}</Text>
          {init?.branding.address ? (
            <Text className="text-xs text-muted">{init.branding.address}</Text>
          ) : null}
        </View>
      </View>

      {init?.guest_join.message ? (
        <Text className="mt-3 text-sm text-muted">{init.guest_join.message}</Text>
      ) : null}

      {ticketKey ? (
        <Card className="mt-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-black">You already have a ticket</Text>
            <Text className="text-xs text-muted">Open it to see your place in the queue.</Text>
          </View>
          <Button title="Open" variant="outline" onPress={() => navigation.navigate('Ticket')} />
        </Card>
      ) : null}

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-black">Choose a service</Text>
        <Pressable accessibilityRole="button" onPress={() => refetch()} disabled={isRefetching}>
          <Text className="text-sm text-primary">{isRefetching ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#6153a3" />
      ) : (
        <FlatList
          data={services ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ServiceRow service={item} showSecondary={init?.tenant.show_secondary_language ?? false} onPress={open} />
          )}
          scrollEnabled={false}
          removeClippedSubviews
          initialNumToRender={8}
          windowSize={5}
          ListEmptyComponent={
            <Text className="mt-6 text-center text-muted">No service is available right now.</Text>
          }
        />
      )}

      {error ? (
        <View className="mt-4">
          <Notice text="Could not load the services. Pull to refresh or try again." tone="error" />
        </View>
      ) : null}

      <View className="mt-8 flex-row gap-3">
        <Button title="My tickets" variant="outline" onPress={() => navigation.navigate('History')} className="flex-1" />
        <Button title="Settings" variant="outline" onPress={() => navigation.navigate('Settings')} className="flex-1" />
      </View>

      <View className="mt-4 items-center">
        <Badge text={init?.branding.name ?? tenant?.name ?? tenant?.subdomain ?? '-'} tone="muted" />
      </View>
    </Screen>
  );
}
