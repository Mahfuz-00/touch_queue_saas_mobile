import { createContext, useContext } from 'react';

import { serviceRepo, ticketRepo } from '@/models/db';
import type { TenantRef } from '@/models/types';
import type { GuestApi } from '@/services/guestApi';
import { guestApi } from '@/services/guestApi';
import type { MobileApi } from '@/services/mobileApi';
import { mobileApi } from '@/services/mobileApi';
import { registerDevice, unregisterDevice } from '@/lib/push';
import { storage } from '@/services/storage';

/**
 * Dependency injection.
 *
 * A hand-rolled container rather than a decorator-based one (tsyringe and
 * friends): React Native needs extra babel configuration for decorator
 * metadata, and an explicit object is easier to read and to swap in tests.
 * Screens never import a service directly — they ask the container.
 */
export type Container = {
  storage: typeof storage;
  services: typeof serviceRepo;
  tickets: typeof ticketRepo;
  push: {
    register: typeof registerDevice;
    unregister: typeof unregisterDevice;
  };
  api: (tenant: TenantRef) => GuestApi;
  mobileApi: (tenant: TenantRef) => MobileApi;
};

export const container: Container = {
  storage,
  services: serviceRepo,
  tickets: ticketRepo,
  push: { register: registerDevice, unregister: unregisterDevice },
  api: guestApi,
  mobileApi,
};

const DependencyContext = createContext<Container>(container);

export const DependencyProvider = DependencyContext.Provider;

/** Resolve one dependency. Explicit keys keep the call sites typed. */
export function useDependency<K extends keyof Container>(key: K): Container[K] {
  return useContext(DependencyContext)[key];
}
