import { useEffect, useMemo, useState } from 'react';
import type { ChatMessage, ToolInvocation } from '../../../../types/domain';
import type { I18nTranslator } from '../../../../i18n';
import { useI18n } from '../../../../i18n';
import { Icon } from '../../../Icon';
import { toolIconName } from '../chatToolIcons';
import { buildThinkingSessionSummary, createThinkingSummaryCopy } from '../thinkingSummary';

type ThinkingSheetProps = {
  message: ChatMessage | null;
  messages: ChatMessage[];
  assistantName: string;
  onClose: () => void;
};

function localizeToolStatus(status: ToolInvocation['status'], t: I18nTranslator['t']) {
  switch (status) {
    case 'running':
      return t('chat.thinking.toolStatus.running');
    case 'preview':
      return t('chat.thinking.toolStatus.preview');
    case 'applied':
      return t('chat.thinking.toolStatus.applied');
    case 'rolled_back':
      return t('chat.thinking.toolStatus.rolled_back');
    case 'superseded':
      return t('chat.thinking.toolStatus.superseded');
    case 'executed':
      return t('chat.thinking.toolStatus.executed');
    case 'saved':
      return t('chat.thinking.toolStatus.saved');
    case 'failed':
      return t('chat.thinking.toolStatus.failed');
    default:
      return status;
  }
}

export function ThinkingSheet({
  message,
  messages,
  assistantName,
  onClose
}: ThinkingSheetProps) {
  const { t } = useI18n();
  const [rawExpanded, setRawExpanded] = useState(false);
  const copy = useMemo(() => createThinkingSummaryCopy(t), [t]);
  const session = useMemo(
    () => (message ? buildThinkingSessionSummary(messages, message.id, copy) : null),
    [copy, message, messages]
  );

  useEffect(() => {
    setRawExpanded(false);
  }, [message?.id]);

  if (!message || !session) return null;

  return (
    <div className="thinking-summary-overlay" role="dialog" aria-modal="true" aria-label={t('chat.thinking.sheetAria')}>
      <button type="button" className="thinking-summary-backdrop" aria-label={t('chat.thinking.closeAria')} onClick={onClose} />
      <div className="thinking-summary-sheet">
        <div className="sheet-handle" />
        <div className="thinking-summary-topbar">
          <button type="button" className="thinking-summary-close" onClick={onClose} aria-label={t('chat.thinking.closeAria')}>
            <Icon name="x" size={18} />
          </button>
          <div className="thinking-summary-title">
            <strong>本轮召回</strong>
            <span>{message.assistantName || assistantName}</span>
          </div>
          <div className="thinking-summary-spacer" aria-hidden="true" />
        </div>
        <div className="thinking-summary-list">
          <article className="thinking-summary-step thinking">
            <div className="thinking-summary-item-rail" aria-hidden="true">
              <span className="thinking-summary-item-dot thinking">
                <Icon name="polarisStar" size={11} color="polarisDeepSpace" />
              </span>
            </div>
            <div className="thinking-summary-step-shell thinking">
              <div className="thinking-summary-phase-list">
                <div className="thinking-summary-phase-item note">
                  <span className="thinking-summary-phase-dot note" aria-hidden="true" />
                  <div className="thinking-summary-phase-copy">
                    <p>Dynamic context 数据尚未接入。Gateway 需要在 SSE 流中返回召回元数据后，此处将按类型展示本轮注入的记忆桶。</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="thinking-summary-raw">
          <button
            type="button"
            className="thinking-summary-raw-toggle"
            onClick={() => setRawExpanded((value) => !value)}
            aria-expanded={rawExpanded}
          >
            <span>{t('chat.thinking.raw')}</span>
            <Icon name={rawExpanded ? 'chevronUp' : 'chevronDown'} size={14} />
          </button>
          {rawExpanded ? (
            <div className="thinking-summary-raw-sections">
              {session.rawSections.map((section) => (
                <section key={section.id} className="thinking-summary-raw-section">
                  <span className="thinking-summary-raw-kicker">{section.label}</span>
                  <pre className="thinking-summary-raw-body">{section.content}</pre>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
