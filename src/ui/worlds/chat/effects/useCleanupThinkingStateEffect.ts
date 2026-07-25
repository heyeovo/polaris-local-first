import { useEffect } from 'react';
import type { ChatMessage } from '../../../../types/domain';
import type { ChatUiState } from '../context/ChatUiState';

export function useCleanupThinkingStateEffect(
  ui: ChatUiState,
  visibleMessages: ChatMessage[],
  isGenerationActive: boolean
) {
  const {
    setCollapsedThinkingMessageIds,
    setSeenThinkingMessageIds,
    setThinkingSummaryMessageId
  } = ui;

  useEffect(() => {
    setCollapsedThinkingMessageIds((current) => {
      const next = current.filter((id) => visibleMessages.some((message) => message.id === id));
      return next.length === current.length ? current : next;
    });
  }, [setCollapsedThinkingMessageIds, visibleMessages]);

  useEffect(() => {
    setSeenThinkingMessageIds((current) => {
      const next = current.filter((id) => visibleMessages.some((message) => message.id === id));
      return next.length === current.length ? current : next;
    });
  }, [setSeenThinkingMessageIds, visibleMessages]);

  useEffect(() => {
    const nextThinkingIds = visibleMessages
      .filter((message) => message.role === 'assistant' && Boolean(message.thinkingText?.trim()))
      .map((message) => message.id);

    if (nextThinkingIds.length === 0) return;

    setSeenThinkingMessageIds((current) => {
      const unseenIds = nextThinkingIds.filter((id) => !current.includes(id));
      if (unseenIds.length === 0) return current;

      // Auto-collapse new thinking only when NOT actively generating.
      // During streaming, keep thinking expanded so the user can follow along.
      if (!isGenerationActive) {
        setCollapsedThinkingMessageIds((collapsed) => {
          const nextCollapsedIds = unseenIds.filter((id) => !collapsed.includes(id));
          if (nextCollapsedIds.length === 0) return collapsed;
          return [...collapsed, ...nextCollapsedIds];
        });
      }

      return [...current, ...unseenIds];
    });
  }, [setCollapsedThinkingMessageIds, setSeenThinkingMessageIds, visibleMessages, isGenerationActive]);

  useEffect(() => {
    setThinkingSummaryMessageId((current) =>
      current && visibleMessages.some((message) => message.id === current) ? current : null
    );
  }, [setThinkingSummaryMessageId, visibleMessages]);
}
