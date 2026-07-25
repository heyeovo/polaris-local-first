import { useChatStore } from '../../stores/chatStore';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { usePersonaStore } from '../../stores/personaStore';
import { Icon } from '../Icon';
import type { ProviderProfile } from '../../types/domain';

type Props = { onClose: () => void; onNewWindow: () => void };

function fmt(n?: number) { if (!n || n <= 0) return '—'; if (n >= 1000) return `${(n / 1000).toFixed(1)}k`; return String(n); }
function ts(ms: number) { const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

export function WindowSettingsSheet({ onClose, onNewWindow }: Props) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const providers = useRuntimeStore((s) => s.providers) as ProviderProfile[];
  const conv = conversations.find((c) => c.id === activeId);
  const collaboratorId = conv?.collaboratorId ?? null;
  const persona = usePersonaStore((s) => s.personas.find((p) => p.id === collaboratorId));
  const currentProviderId = persona?.advanced?.providerId || useRuntimeStore.getState().activeProviderId || '';
  const updateCollaborator = usePersonaStore((s) => s.updateCollaborator);
  const msgs = conv?.messages ?? [];
  const asst = msgs.filter((m: any) => m.role === 'assistant' && !m.toolInvocation);
  const totalT = asst.reduce((s: number, m: any) => s + (m.tokenUsage?.totalTokens || m.tokenCount || 0), 0);
  const chars = msgs.reduce((s: number, m: any) => s + (typeof m.content === 'string' ? m.content.length : 0), 0);
  const rows = asst.filter((m: any) => (m.tokenUsage?.totalTokens || m.tokenCount || 0) > 0).slice(-10).reverse();

  const handleProviderChange = (nextProviderId: string) => {
    if (!collaboratorId) return;
    const selectedProvider = providers.find((p) => p.id === nextProviderId);
    updateCollaborator(collaboratorId, {
      advanced: {
        providerId: nextProviderId,
        modelOverride: selectedProvider?.model || '',
      }
    });
  };

  return (
    <div className="menu-sheet-page" style={{ flex: 1, overflow: 'auto', padding: '0 1.25rem' }}>
      <div className="menu-sheet-header">
        <button type="button" className="menu-sheet-back" aria-label="返回" onClick={onClose}>
          <span className="menu-sheet-back-icon"><Icon name="chevron" size={26} /></span>
        </button>
        <div className="menu-sheet-title">
          <small>窗口设置</small>
          <h2>{conv?.title || '—'}</h2>
        </div>
      </div>

      <section className="menu-section">
        <div className="menu-section-head">
          <span className="menu-section-kicker">统计</span>
        </div>
        <div className="usage-overview-grid">
          <div className="usage-metric-tile">
            <div className="usage-metric-tile-value">{fmt(totalT)}</div>
            <div className="usage-metric-tile-label">总 token</div>
          </div>
          <div className="usage-metric-tile">
            <div className="usage-metric-tile-value">{msgs.length}</div>
            <div className="usage-metric-tile-label">消息</div>
          </div>
          <div className="usage-metric-tile">
            <div className="usage-metric-tile-value">{chars >= 1000 ? `${(chars / 1000).toFixed(1)}k` : String(chars)}</div>
            <div className="usage-metric-tile-label">字数</div>
          </div>
        </div>
      </section>

      {providers.length > 0 && (
        <section className="menu-section">
          <div className="menu-section-head">
            <span className="menu-section-kicker">模型</span>
          </div>
          <div className="menu-sheet-item">
            <div className="menu-sheet-item-body">
              <select
                value={currentProviderId}
                onChange={(e) => handleProviderChange(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: 'var(--type-body)', color: 'var(--text-primary)', background: 'var(--surface)' }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.id}{p.model ? ` · ${p.model}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="menu-section">
          <div className="menu-section-head">
            <span className="menu-section-kicker">{`最近消耗（${rows.length}）`}</span>
          </div>
          <div className="usage-entry-list">
            {rows.map((m: any) => (
              <div key={m.id} className="usage-entry-row">
                <div className="usage-entry-header">
                  <span className="usage-entry-title">{m.model || '—'}</span>
                  <span className="usage-entry-meta">{ts(m.timestamp)}</span>
                </div>
                <div className="usage-entry-detail">
                  {typeof m.content === 'string' ? m.content.slice(0, 80).replace(/\n/g, ' ') : '…'}
                </div>
                <div className="usage-entry-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                  <span>总 {fmt(m.tokenUsage?.totalTokens ?? m.tokenCount)}</span>
                  {(m.tokenUsage?.cachedInputTokens ?? 0) > 0 && <span style={{ color: 'var(--color-digested)' }}>缓存读 {fmt(m.tokenUsage?.cachedInputTokens)}</span>}
                  {(m.tokenUsage?.cacheMissInputTokens ?? 0) > 0 && <span style={{ color: 'var(--color-pinned)' }}>缓存写 {fmt(m.tokenUsage?.cacheMissInputTokens)}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="menu-section" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          onClick={onNewWindow}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 14,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          换窗
        </button>
      </section>
    </div>
  );
}
