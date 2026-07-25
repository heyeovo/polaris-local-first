import { useState } from 'react';
import type { ChatMessage } from '../../../../types/domain';
import { Icon } from '../../../Icon';
import { formatTokenCount } from '../chatTokenCount';
import { useI18n } from '../../../../i18n';

type MessageMetaProps = {
  message: ChatMessage;
  fallbackAssistantName: string;
  isThinkingActive: boolean;
  onOpenThinkingSummary: (message: ChatMessage) => void;
  showIdentity?: boolean;
  showName?: boolean;
  showDetails?: boolean;
  showThinking?: boolean;
  splitIdentityLines?: boolean;
};

export function MessageMeta({
  message,
  fallbackAssistantName,
  isThinkingActive,
  onOpenThinkingSummary,
  showIdentity = true,
  showName = true,
  showDetails = true,
  showThinking = true,
  splitIdentityLines = false
}: MessageMetaProps) {
  const { formatNumber, t } = useI18n();
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const tokenLabel = formatTokenCount(message.tokenCount, message.tokenUsage, {
    formatNumber,
    totalLabel: (count) => t('chat.messageMeta.totalTokens', { count })
  });
  const identityName = message.assistantName || fallbackAssistantName;
  const showIdentityDetail = showDetails && Boolean(message.model || tokenLabel);
  const identityDetail = (
    <>
      {message.model && <span className="message-identity-pill">{message.model}</span>}
      {tokenLabel && <span className="message-identity-pill">{tokenLabel}</span>}
    </>
  );
  const thinkingDurationLabel = message.thinkingDurationMs != null
    ? `${(message.thinkingDurationMs / 1000).toFixed(1)}s`
    : null;

  return (
    <>
      <div className={`message-identity-row ${showIdentity ? '' : 'thinking-only'}`.trim()}>
        {showIdentity ? (
          <div className={splitIdentityLines ? 'message-identity-stack' : 'message-identity-meta'}>
            {splitIdentityLines && showName ? (
              <>
                <span className="message-identity-name message-identity-name-primary">{identityName}</span>
                {showIdentityDetail ? (
                  <div className="message-identity-meta message-identity-secondary">
                    {identityDetail}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {showName ? <span className="message-identity-name">{identityName}</span> : null}
                {showIdentityDetail ? identityDetail : null}
              </>
            )}
          </div>
        ) : null}
        {showThinking && message.thinkingText ? (
          <button
            type="button"
            className={`thinking-inline-trigger ${isThinkingActive ? 'active' : ''}`}
            aria-label={t('chat.messageActions.openThinking')}
            title={t('chat.messageActions.thinkingTitle')}
            onClick={() => onOpenThinkingSummary(message)}
          >
            <span className={`thinking-inline-icon ${isThinkingActive ? 'spinning' : ''}`} aria-hidden="true">
              <Icon name="polarisStar" size={14} color="polarisDeepSpace" />
            </span>
          </button>
        ) : null}
      </div>
      {showThinking && message.thinkingText ? (
        <div className={`thinking-inline-block ${thinkingExpanded ? 'expanded' : 'collapsed'}`}>
          <button
            type="button"
            className="thinking-inline-block-toggle"
            onClick={() => setThinkingExpanded((v) => !v)}
          >
            <span className={`thinking-inline-block-icon ${isThinkingActive ? 'spinning' : ''}`} aria-hidden="true">
              <Icon name="polarisStar" size={13} color="polarisDeepSpace" />
            </span>
            <span className="thinking-inline-block-label">
              {t('chat.messageActions.thinkingTitleActive')}{thinkingDurationLabel ? ` (${thinkingDurationLabel})` : ''}
            </span>
            <Icon name={thinkingExpanded ? 'chevronUp' : 'chevronDown'} size={14} />
          </button>
          {thinkingExpanded ? (
            <div className="thinking-inline-block-content">
              {message.thinkingText}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
