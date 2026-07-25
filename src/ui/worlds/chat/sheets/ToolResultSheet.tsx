import { useEffect } from 'react';
import type { ToolInvocation } from '../../../../types/domain';
import { Icon } from '../../../Icon';

type ToolResultSheetProps = {
  tool: ToolInvocation | null;
  onClose: () => void;
};

export function ToolResultSheet({ tool, onClose }: ToolResultSheetProps) {
  useEffect(() => {
    if (!tool) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tool, onClose]);

  if (!tool) return null;

  const args = tool.mcpResult?.argumentsObject as Record<string, unknown> | undefined;
  const detailText = tool.detailText?.trim() || '';
  const toolLabel = tool.mcpResult?.toolName || tool.title || 'MCP 工具';

  return (
    <div className="thinking-summary-overlay" role="dialog" aria-modal="true">
      <button type="button" className="thinking-summary-backdrop" aria-label="关闭" onClick={onClose} />
      <div className="thinking-summary-sheet">
        <div className="sheet-handle" />
        <div className="thinking-summary-topbar">
          <button type="button" className="thinking-summary-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={18} />
          </button>
          <div className="thinking-summary-title">
            <strong>{toolLabel}</strong>
            <span>{tool.status === 'executed' ? '已执行' : tool.status}</span>
          </div>
          <div className="thinking-summary-spacer" aria-hidden="true" />
        </div>

        <div className="tool-result-sheet-body">
          {args && Object.keys(args).length > 0 ? (
            <section className="tool-result-sheet-section">
              <div className="tool-result-sheet-section-title">参数</div>
              <div className="tool-result-sheet-params">
                {Object.entries(args).map(([key, value]) => (
                  <div key={key} className="tool-result-sheet-param-row">
                    <span className="tool-result-sheet-param-key">{key}</span>
                    <span className="tool-result-sheet-param-value">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {detailText ? (
            <section className="tool-result-sheet-section">
              <div className="tool-result-sheet-section-title">结果</div>
              <div className="tool-result-sheet-detail">{detailText}</div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
