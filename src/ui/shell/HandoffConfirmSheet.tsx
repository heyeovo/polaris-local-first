import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSpaceStore } from '../../stores/spaceStore';
import { usePersonaStore } from '../../stores/personaStore';
import { Icon } from '../Icon';
import { setForceHandoffForNextRequest } from '../../engines/chat-api/sessionHandoffFlag';

type BucketPreview = { id: string; name: string; snippet: string; charCount: number };

type Props = { onClose: () => void };

export function HandoffConfirmSheet({ onClose }: Props) {
  const [pinned, setPinned] = useState<BucketPreview[]>([]);
  const [recent, setRecent] = useState<BucketPreview[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [includeRounds, setIncludeRounds] = useState(false);
  const [roundCount, setRoundCount] = useState(20);

  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setWorld = useSpaceStore((s) => s.setWorld);

  useEffect(() => {
    setLoading(true);
    fetch('/api/gateway/api/preview-handoff')
      .then((r) => r.json())
      .then((data) => {
        const p: BucketPreview[] = Array.isArray(data.pinned) ? data.pinned : [];
        const r: BucketPreview[] = Array.isArray(data.recent) ? data.recent : [];
        setPinned(p);
        setRecent(r);
        setChecked(new Set([...p.map((b) => b.id), ...r.map((b) => b.id)]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleConfirm = () => {
    const allIds = [...pinned.map(b => b.id), ...recent.map(b => b.id)];
    const hasDeselected = checked.size < allIds.length;
    setForceHandoffForNextRequest(hasDeselected ? [...checked] : undefined);

    let systemMessage: string | undefined;
    if (includeRounds) {
      const state = useChatStore.getState();
      const messages = state.conversations
        .find(c => c.id === state.activeConversationId)
        ?.messages ?? [];
      const textMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      const recentMessages = textMessages.slice(-roundCount * 2);

      if (recentMessages.length > 0) {
        const lines: string[] = [];
        for (const m of recentMessages) {
          const role = m.role === 'user' ? 'User' : 'Assistant';
          const raw = typeof m.content === 'string' ? m.content.trim() : '';
          if (!raw) continue;
          const maxLen = m.role === 'user' ? 500 : 1000;
          const text = raw.length > maxLen ? raw.slice(0, maxLen) + '...' : raw;
          lines.push(`${role}: ${text}`);
        }
        if (lines.length > 0) {
          systemMessage = [
            '[跨窗口对话原文]',
            `以下是上一个窗口最近 ${Math.floor(lines.length / 2)} 轮对话记录，与当前会话连续。请自然衔接对话，不要机械复述。`,
            '',
            lines.join('\n\n'),
          ].join('\n');
          console.log('[Handoff] cross-window system message built:', systemMessage.length, 'chars');
        }
      }
    }

    const collaboratorId = usePersonaStore.getState().activeCollaboratorId;
    const id = createConversation(collaboratorId);
    setActiveConversation(id);
    setWorld('chat');

    if (systemMessage) {
      const state = useChatStore.getState();
      const conv = state.conversations.find(c => c.id === id);
      if (conv) {
        state.addMessage(
          { conversationId: id, conversation: conv, messages: conv.messages },
          {
            id: `cw-${id}`,
            role: 'system',
            content: systemMessage,
            timestamp: Date.now(),
            origin: 'system-note',
          },
        );
        console.log('[Handoff] cross-window system message inserted into conversation');
      }
    }

    onClose();
  };

  return (
    <div className="menu-sheet-page" style={{ flex: 1, overflow: 'auto', padding: '0 1.25rem' }}>
      <div className="menu-sheet-header">
        <button type="button" className="menu-sheet-back" aria-label="返回" onClick={onClose}>
          <span className="menu-sheet-back-icon"><Icon name="chevron" size={26} /></span>
        </button>
        <div className="menu-sheet-title">
          <small>换窗</small>
          <h2>预览</h2>
        </div>
      </div>

      {loading ? (
        <section className="menu-section">
          <div className="usage-empty-state">加载中…</div>
        </section>
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="menu-section">
              <div className="menu-section-head">
                <span className="menu-section-kicker">{`钉选桶（${pinned.length}）`}</span>
              </div>
              {pinned.map((b) => (
                <label key={b.id} className="menu-sheet-item" style={{ cursor: 'pointer' }}>
                  <div className="menu-sheet-item-icon" style={{ display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
                    <input type="checkbox" checked={checked.has(b.id)} onChange={() => toggle(b.id)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                  </div>
                  <div className="menu-sheet-item-body" style={{ flex: 1 }}>
                    <div className="menu-sheet-item-title">{b.name}</div>
                    <div className="menu-sheet-item-detail" style={{ fontSize: 'var(--type-caption)', color: 'var(--text-tertiary)' }}>{b.charCount} 字</div>
                    <div style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{b.snippet.slice(0, 200) || '（无内容）'}</div>
                  </div>
                </label>
              ))}
            </section>
          )}

          {recent.length > 0 && (
            <section className="menu-section">
              <div className="menu-section-head">
                <span className="menu-section-kicker">{`最近记忆（${recent.length}）`}</span>
              </div>
              {recent.map((b) => (
                <label key={b.id} className="menu-sheet-item" style={{ cursor: 'pointer' }}>
                  <div className="menu-sheet-item-icon" style={{ display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
                    <input type="checkbox" checked={checked.has(b.id)} onChange={() => toggle(b.id)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                  </div>
                  <div className="menu-sheet-item-body" style={{ flex: 1 }}>
                    <div className="menu-sheet-item-title">{b.name}</div>
                    <div className="menu-sheet-item-detail" style={{ fontSize: 'var(--type-caption)', color: 'var(--text-tertiary)' }}>{b.charCount} 字</div>
                    <div style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{b.snippet.slice(0, 200) || '（无内容）'}</div>
                  </div>
                </label>
              ))}
            </section>
          )}

          <section className="menu-section">
            <div className="menu-section-head">
              <span className="menu-section-kicker">高级选项</span>
            </div>
            <label className="menu-sheet-item" style={{ cursor: 'pointer' }}>
              <div className="menu-sheet-item-icon" style={{ display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
                <input type="checkbox" checked={includeRounds} onChange={(e) => setIncludeRounds(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              </div>
              <div className="menu-sheet-item-body" style={{ flex: 1 }}>
                <div className="menu-sheet-item-title">带入最近对话原文</div>
              </div>
            </label>
            {includeRounds && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginLeft: '2.5rem' }}>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={roundCount}
                  onChange={(e) => setRoundCount(Math.max(1, Math.min(100, Number(e.target.value) || 20)))}
                  style={{ width: 64, padding: '0.4rem 0.5rem', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}
                />
                <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-tertiary)' }}>轮</span>
              </div>
            )}
          </section>

          <section className="menu-section" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={handleConfirm}
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
              确认换窗
            </button>
          </section>
        </>
      )}
    </div>
  );
}
