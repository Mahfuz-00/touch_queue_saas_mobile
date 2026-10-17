import { useCallback, useEffect, useRef, useState } from 'react';

import { useDependency } from '@/di/container';
import type { TenantRef } from '@/models/types';
import { ApiError } from '@/services/guestApi';
import { useSession } from '@/store/session';

/** Turn a failed clinic lookup into something a guest can act on. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'No clinic is accepting walk-ins on that code.';
    }

    if (error.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }

    return error.message;
  }

  return 'Could not reach that clinic. Check the code and your connection.';
}

/**
 * Choose which clinic this session belongs to, by validating it against the
 * clinic's own /init endpoint before we commit to it. A typo shows up here as a
 * clear message instead of as mystery failures on the next screen.
 */
export function useChooseTenant() {
  const api = useDependency('api');
  const setTenant = useSession((state) => state.setTenant);
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A screen that goes away mid-lookup must not resolve into nothing.
  useEffect(() => () => controller.current?.abort(), []);

  const choose = useCallback(
    async (tenant: TenantRef | null): Promise<boolean> => {
      if (!tenant) {
        setError("That code doesn't look like a Touch Queue join code.");
        return false;
      }

      controller.current?.abort();
      controller.current = new AbortController();

      setBusy(true);
      setError(null);

      try {
        const info = await api(tenant).init(controller.current.signal);
        setTenant({ ...tenant, name: info.tenant.name });

        return true;
      } catch (caught) {
        // An aborted request is not a failure worth showing.
        if ((caught as Error)?.name !== 'AbortError') {
          setError(messageFor(caught));
        }

        return false;
      } finally {
        setBusy(false);
      }
    },
    [api, setTenant],
  );

  return { choose, busy, error, setError };
}
