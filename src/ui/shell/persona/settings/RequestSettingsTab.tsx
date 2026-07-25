import { useState, type ReactNode } from 'react';
import {
  getProviderModelDisplayLabel
} from '../../apiProviderDisplay';
import type { I18nKey } from '../../../../i18n/messages';
import { useI18n } from '../../../../i18n/useI18n';
import type { McpServerConfig } from '../../../../types/domain';
import { Icon, type IconName } from '../../../Icon';
import { type PersonaTabProps } from '../personaUiShared';
import { CustomRequestSettingsTab } from './CustomRequestSettingsTab';
import { EngineSettingsTab } from './EngineSettingsTab';
import { PersonaMcpSettingsPage } from './PersonaMcpSettingsPage';

type RequestSettingsTabProps = PersonaTabProps & {
  onOpenProviderSettings?: () => void;
  mcpServers: McpServerConfig[];
  mcpToolTimeoutSeconds: number;
  onCreateMcpServer: (seed?: Partial<McpServerConfig>) => string;
  onUpdateMcpServer: (serverId: string, patch: Partial<McpServerConfig>) => void;
};

type RequestSettingsPage = 'route' | 'engine' | 'custom' | 'mcp';

const REQUEST_PAGE_META: Array<{
  id: RequestSettingsPage;
  labelKey: I18nKey;
  icon: IconName;
}> = [
  { id: 'route', labelKey: 'request.settings.providerSection', icon: 'providerRoute' },
  { id: 'engine', labelKey: 'request.settings.engineSection', icon: 'orbit' },
  { id: 'custom', labelKey: 'request.settings.customSection', icon: 'code' },
  { id: 'mcp', labelKey: 'request.settings.mcpSection', icon: 'mcpServer' }
];

function ProviderBindingSettings({
  activePersona,
  providers = [],
  onUpdatePersona,
  onOpenProviderSettings
}: RequestSettingsTabProps) {
  const { t } = useI18n();
  const fixedProviderId = activePersona?.advanced.providerId?.trim() || '';
  const fixedProvider = providers.find((provider) => provider.id === fixedProviderId) ?? null;
  const hasProviderBinding = Boolean(fixedProviderId || activePersona?.advanced.modelOverride.trim());

  const updateProviderBinding = (providerId: string) => {
    if (!providerId) {
      onUpdatePersona({ advanced: { providerId: '', modelOverride: '' } });
      return;
    }
    const provider = providers.find((entry) => entry.id === providerId);
    if (!provider) return;
    // modelOverride 留空，让请求组装那一层回落到 provider 的当前模型。
    // 以前这里抄一份模型名当快照，之后在 provider 里改模型快照不跟着动，
    // 于是要「切到别的 provider 再切回来」才生效。
    onUpdatePersona({ advanced: { providerId: provider.id, modelOverride: '' } });
  };

  return (
    <>
      <div className="ps-field">
        <div className="ps-field-head">
          <span className="ps-field-label">{t('request.settings.providerLabel')}</span>
          <span className="ps-field-hint">{t('request.settings.providerHint')}</span>
        </div>
        <select
          className="ps-input"
          value={fixedProviderId}
          onChange={(event) => updateProviderBinding(event.target.value)}
        >
          <option value="">{t('request.settings.followGlobalProvider')}</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} · {getProviderModelDisplayLabel(provider)}
            </option>
          ))}
        </select>
        <div className="provider-inline-actions">
          <button
            type="button"
            className="btn-secondary compact"
            onClick={() => onUpdatePersona({ advanced: { providerId: '', modelOverride: '' } })}
            disabled={!hasProviderBinding}
          >
            {t('request.settings.followGlobal')}
          </button>
          {onOpenProviderSettings ? (
            <button
              type="button"
              className="btn-secondary compact"
              onClick={onOpenProviderSettings}
            >
              {t('request.settings.openProviderSettings')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="ps-field">
        <div className="ps-field-head">
          <span className="ps-field-label">{t('request.settings.modelLabel')}</span>
          <span className="ps-field-hint">
            {fixedProvider
              ? t('request.settings.providerModelHint', { name: fixedProvider.name })
              : t('request.settings.globalModelHint')}
          </span>
        </div>
        <input
          className="ps-input ps-input--mono"
          value={fixedProvider ? getProviderModelDisplayLabel(fixedProvider) : ''}
          placeholder={t('request.settings.modelPlaceholder')}
          readOnly
          disabled
        />
      </div>
    </>
  );
}

function RequestSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="request-settings-section">
      <div className="request-settings-section-title">{title}</div>
      {children}
    </div>
  );
}

export function RequestSettingsTab(props: RequestSettingsTabProps) {
  const { t } = useI18n();
  const [activePage, setActivePage] = useState<RequestSettingsPage>('route');

  return (
    <div className="request-settings-flow">
      <div className="room-theme-page-nav request-page-nav" role="tablist" aria-label={t('request.settings.pageNavLabel')}>
        {REQUEST_PAGE_META.map((page) => (
          <button
            key={page.id}
            type="button"
            className={activePage === page.id ? 'active' : ''}
            onClick={() => setActivePage(page.id)}
          >
            <Icon name={page.icon} size={14} />
            <span>{t(page.labelKey)}</span>
          </button>
        ))}
      </div>

      {activePage === 'route' ? (
        <RequestSection title={t('request.settings.providerSection')}>
          <ProviderBindingSettings {...props} />
        </RequestSection>
      ) : null}
      {activePage === 'engine' ? (
        <RequestSection title={t('request.settings.engineSection')}>
          <EngineSettingsTab {...props} />
        </RequestSection>
      ) : null}
      {activePage === 'custom' ? (
        <RequestSection title={t('request.settings.customSection')}>
          <CustomRequestSettingsTab {...props} />
        </RequestSection>
      ) : null}
      {activePage === 'mcp' ? (
        <RequestSection title={t('request.settings.mcpSection')}>
          <PersonaMcpSettingsPage {...props} />
        </RequestSection>
      ) : null}
    </div>
  );
}
