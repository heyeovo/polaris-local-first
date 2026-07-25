// Module-level cache for cross-chat recall content.
// First turn computes the recall; subsequent turns read from cache.
// Dual-layer: in-memory Map (fast) + localStorage (survives refresh).
//
// localStorage keys are stable: recall content is written once per
// conversation and never changes within that window, so it naturally
// stays in the prompt cache prefix.

import type { AssistantSemanticRecallContextCandidate } from './requestSemanticRecallPlan';

const crossChatRecallCache = new Map<string, AssistantSemanticRecallContextCandidate[]>();
const LS_PREFIX = 'cross_chat_recall:';

function lsKey(conversationId: string) {
  return LS_PREFIX + conversationId;
}

export function getCrossChatRecallCandidates(
  conversationId?: string | null,
): AssistantSemanticRecallContextCandidate[] | undefined {
  if (!conversationId) return undefined;
  const memory = crossChatRecallCache.get(conversationId);
  if (memory) return memory;

  // Cache miss — try localStorage (survives page refresh)
  try {
    const raw = localStorage.getItem(lsKey(conversationId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        crossChatRecallCache.set(conversationId, parsed);
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or corrupted — ignore
  }
  return undefined;
}

export function setCrossChatRecallCandidates(
  conversationId: string,
  candidates: AssistantSemanticRecallContextCandidate[],
): void {
  crossChatRecallCache.set(conversationId, candidates);
  try {
    localStorage.setItem(lsKey(conversationId), JSON.stringify(candidates));
  } catch {
    // localStorage full or unavailable — memory-only
  }
}

export function clearCrossChatRecallCache(): void {
  crossChatRecallCache.clear();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch { /* ignore */ }
}
