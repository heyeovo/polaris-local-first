import { useEffect, useMemo, useState } from 'react';
import {
  readLatestPersistenceError,
  subscribeLatestPersistenceError,
  type PersistenceDiagnosticEntry
} from '../../infrastructure/persistenceDiagnostics';
import { useChatStore } from '../../stores/chatStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { usePersonaStore } from '../../stores/personaStore';
import { useRuntimeStore } from '../../stores/runtimeStore';

export type PersistenceReadFailureNoticeState = {
  visible: boolean;
  error: PersistenceDiagnosticEntry | null;
  blockedStores: string[];
  reason: 'read-failure' | 'write-failure' | null;
};

export type PersistenceReadFailureHydrationState = {
  startupReady: boolean;
  chatHydrated: boolean;
  collectionHydrated: boolean;
  personaHydrated: boolean;
  runtimeHydrated: boolean;
};

function isCoreStoreFailure(error: PersistenceDiagnosticEntry | null) {
  if (!error) return false;
  return ['chat', 'collection', 'persona', 'runtime'].includes(error.store);
}

function getFailureReason(error: PersistenceDiagnosticEntry | null): 'read-failure' | 'write-failure' | null {
  if (!error || !isCoreStoreFailure(error)) return null;
  if (error.operation.startsWith('read')) return 'read-failure';
  return 'write-failure';
}

export function derivePersistenceReadFailureNotice(
  error: PersistenceDiagnosticEntry | null,
  hydration: PersistenceReadFailureHydrationState
): PersistenceReadFailureNoticeState {
  const blockedStores = [
    !hydration.chatHydrated ? '对话' : null,
    !hydration.collectionHydrated ? '房间' : null,
    !hydration.personaHydrated ? '协作者' : null,
    !hydration.runtimeHydrated ? '设置' : null
  ].filter((item): item is string => Boolean(item));

  const reason = getFailureReason(error);

  // 读失败：只有在确实有 store 没 hydrate 成功时才提示。
  // 写失败：store 早就 hydrate 好了，blockedStores 必然为空，所以只看 startupReady。
  const visible =
    reason === 'read-failure'
      ? Boolean(blockedStores.length > 0 && hydration.startupReady)
      : reason === 'write-failure'
        ? hydration.startupReady
        : false;

  return {
    visible,
    error,
    blockedStores,
    reason
  };
}

export function usePersistenceReadFailureNotice(startupReady: boolean): PersistenceReadFailureNoticeState {
  const chatHydrated = useChatStore((state) => state.hydrated);
  const collectionHydrated = useCollectionStore((state) => state.hydrated);
  const personaHydrated = usePersonaStore((state) => state.hydrated);
  const runtimeHydrated = useRuntimeStore((state) => state.hydrated);
  const [error, setError] = useState<PersistenceDiagnosticEntry | null>(() => readLatestPersistenceError());

  useEffect(() => subscribeLatestPersistenceError(setError), []);

  return useMemo(
    () => derivePersistenceReadFailureNotice(error, {
      startupReady,
      chatHydrated,
      collectionHydrated,
      personaHydrated,
      runtimeHydrated
    }),
    [chatHydrated, collectionHydrated, error, personaHydrated, runtimeHydrated, startupReady]
  );
}
