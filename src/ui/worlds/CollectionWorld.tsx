import { useEffect, useMemo, useState } from 'react';
import { runSelectionAction } from '../haptics';
import { useCollectionWorldController } from '../../app/collection/useCollectionWorldController';
import { setForceHandoffForNextRequest, setSkipHandoffForNextRequest } from '../../engines/chat-api/sessionHandoffFlag';
import { CollaboratorScopeStrip } from '../collection/grid/CollaboratorScopeStrip';
import { CollectionFloatingCreateAction } from '../collection/grid/CollectionFloatingCreateAction';
import { CollectionShelfTabs } from '../collection/grid/CollectionShelfTabs';
import { buildVisibleCollectionShelfNavItems } from '../collection/grid/collectionShelfNav';
import { DialogueCollectionShelf } from '../collection/grid/DialogueCollectionShelf';
import { CollaboratorInfoShelf } from '../collection/info/CollaboratorInfoShelf';
import { ImageCollectionShelf } from '../collection/images/ImageCollectionShelf';
import { CodeProjectCollectionShelfPages } from './collection/CodeProjectCollectionShelfPages';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';

type CollectionWorldProps = {
  searchOpen: boolean;
  collaboratorSwitchOpen: boolean;
  onCollaboratorSwitchOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  onDeleteCollaborator: (collaboratorId: string) => void;
  infoFullscreenOpen: boolean;
  onInfoFullscreenOpenChange: (open: boolean) => void;
  onDetailOpenChange: (open: boolean) => void;
  onOpenCollaboratorBuilderForCreate: () => void;
  onCreateCustomCollaborator: () => void;
  onOpenProviderSettings: () => void;
  onOpenDesktopLocalSettings: () => void;
};

export function CollectionWorld({
  searchOpen,
  collaboratorSwitchOpen,
  onCollaboratorSwitchOpenChange,
  onOpenSettings,
  onDeleteCollaborator,
  infoFullscreenOpen,
  onInfoFullscreenOpenChange,
  onDetailOpenChange,
  onOpenCollaboratorBuilderForCreate,
  onCreateCustomCollaborator,
  onOpenProviderSettings,
  onOpenDesktopLocalSettings
}: CollectionWorldProps) {
  const { t } = useI18n();
  const controller = useCollectionWorldController({
    confirm: (message) => window.confirm(message),
    alert: (message) => window.alert(message)
  });
  const collaboratorInfoShelfLabel = controller.currentCollaborator?.name.trim() || t('common.collaborator');
  const visibleShelfItems = useMemo(
    () =>
      buildVisibleCollectionShelfNavItems(
        {
          dialogue: true,
          info: true,
          code: true,
          project: true,
          image: true
        },
        t
      ).map((item) => (
        item.shelf === 'info'
          ? { ...item, label: collaboratorInfoShelfLabel }
          : item
      )),
    [collaboratorInfoShelfLabel, t]
  );
  const visibleShelfSet = useMemo(
    () => new Set(visibleShelfItems.map((item) => item.shelf)),
    [visibleShelfItems]
  );
  const [floatingActionHost, setFloatingActionHost] = useState<HTMLDivElement | null>(null);
  const activeShelf = controller.collectionShelf;
  const setCollectionShelf = controller.setCollectionShelf;
  useEffect(() => {
    if (visibleShelfSet.has(activeShelf)) return;
    setCollectionShelf(visibleShelfItems[0]?.shelf ?? 'dialogue');
  }, [activeShelf, setCollectionShelf, visibleShelfItems, visibleShelfSet]);

  useEffect(() => {
    onDetailOpenChange(controller.collectionShelf === 'code' && controller.codeWorkshopOpen);
  }, [controller.codeWorkshopOpen, controller.collectionShelf, onDetailOpenChange]);

  const [showNewConvDialog, setShowNewConvDialog] = useState(false);
  const [newConvMode, setNewConvMode] = useState<'handoff' | 'clean'>('handoff');

  useEffect(() => () => onDetailOpenChange(false), [onDetailOpenChange]);

  useEffect(() => {
    if (infoFullscreenOpen) {
      onInfoFullscreenOpenChange(false);
    }
  }, [infoFullscreenOpen, onInfoFullscreenOpenChange]);

  return (
    <section className={`world world-collection ${controller.collectionShelf === 'code' && controller.codeWorkshopOpen ? 'collection-world-workshop-open' : ''}`}>
      <CollaboratorScopeStrip
        open={collaboratorSwitchOpen}
        personas={controller.personas}
        conversationCounts={controller.collaboratorConversationCounts}
        collaboratorScopeId={controller.collaboratorScopeId}
        onSelectCollaboratorScope={controller.onSelectCollaboratorScope}
        onOpenGroupWorld={controller.onOpenGroupWorld}
        onToggleCollaboratorPinned={controller.onCollaboratorPinToggle}
        onClose={() => onCollaboratorSwitchOpenChange(false)}
        onCreateFromBuilder={onOpenCollaboratorBuilderForCreate}
        onCreateCustomCollaborator={onCreateCustomCollaborator}
        onOpenSettings={onOpenSettings}
        onSelectShelf={(shelf) => {
          controller.setCollectionShelf(shelf);
        }}
        collectionShelf={controller.collectionShelf}
      />

      <div className={`surface-motion-local-stage collection-shelf-stage ${searchOpen ? 'collection-shelf-stage--controls-open' : ''}`}>
        {searchOpen && controller.collectionShelf !== 'info' ? (
          <div className="collection-shelf-controls">
              <div className="search-wrap">
                <input
                  className="search-input"
                  value={controller.searchTerm}
                  onChange={(event) => controller.setSearchTerm(event.target.value)}
                  placeholder={
                    controller.collectionShelf === 'code'
                      ? t('collection.world.searchCode')
                      : controller.collectionShelf === 'project'
                        ? t('collection.world.searchProject')
                        : controller.collectionShelf === 'image'
                          ? t('collection.world.searchImage')
                          : t('collection.world.searchDialogue')
                  }
                />
                {controller.collectionShelf === 'code' && controller.codeSearchTagSuggestions.length > 0 ? (
                  <div className="collection-search-suggestions" aria-label={t('collection.world.searchSuggestionsAria')}>
                    {controller.codeSearchTagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="chip collection-search-suggestion"
                        onClick={(event) => {
                          runSelectionAction(() => controller.setSearchTerm(tag), { element: event.currentTarget });
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
          </div>
        ) : null}

        {!controller.ready ? (
          <div className="empty-state-floating collection-loading-state">
            <p className="empty-state-title">{t('collection.world.loadingRooms')}</p>
          </div>
        ) : (
          <div
            className="collection-shelf-rail"
            aria-label={t('collection.world.roomViewAria')}
          >
            {visibleShelfSet.has('info') && activeShelf === 'info' ? (
            <div
              className="collection-shelf-page collection-shelf-page--info collection-shelf-page--active"
              data-shelf-page="info"
            >
              <div className="collection-shelf-page-body collection-shelf-page-body--info">
                <CollaboratorInfoShelf
                  isAggregateScope={controller.isAggregateScope}
                  currentCollaboratorId={controller.currentCollaboratorId}
                  currentCollaborator={controller.currentCollaborator}
                  fullscreenOpen={false}
                  showChatAvatars={controller.showChatAvatars}
                  providers={controller.providers}
                  activeProviderId={controller.activeProviderId}
                  conversations={controller.conversations}
                  triggerRules={controller.triggerRules}
                  mcpServers={controller.mcpServers}
                  mcpToolTimeoutSeconds={controller.mcpToolTimeoutSeconds}
                  collaboratorOverviewItems={controller.collaboratorOverviewItems}
                  editing={searchOpen}
                  onUpdateCollaborator={controller.onUpdateCurrentCollaborator}
                  onSelectCollaborator={controller.onSelectCollaboratorScope}
                  onToggleCollaboratorPinned={controller.onCollaboratorPinToggle}
                  onDeleteCollaborator={onDeleteCollaborator}
                  onSelectCollaboratorAvatar={controller.onSelectCurrentCollaboratorAvatar}
                  onCreateFromBuilder={onOpenCollaboratorBuilderForCreate}
                  onCreateCustomCollaborator={onCreateCustomCollaborator}
                  onOpenProviderSettings={onOpenProviderSettings}
                  onCreateTriggerRule={controller.onCreateAutomationRule}
                  onUpdateTriggerRule={controller.onUpdateAutomationRule}
                  onDeleteTriggerRule={controller.onDeleteAutomationRule}
                  onTestTriggerRule={controller.onTestAutomationRule}
                  onCopyTriggerUrl={controller.onCopyAutomationTriggerUrl}
                  onCreateMcpServer={controller.onCreateMcpServer}
                  onUpdateMcpServer={controller.onUpdateMcpServer}
                />
              </div>
            </div>
            ) : null}

            {visibleShelfSet.has('dialogue') && activeShelf === 'dialogue' ? (
            <div
              className="collection-shelf-page collection-shelf-page--dialogue collection-shelf-page--active"
              data-shelf-page="dialogue"
            >
              <div className="collection-shelf-page-body">
                <DialogueCollectionShelf
                  cardsExpanded={searchOpen}
                  conversations={controller.filteredConversations}
                  personas={controller.personas}
                  roomProjects={controller.roomProjects}
                  activeConversationId={controller.activeConversationId}
                  editingConversationId={controller.editingConversationId}
                  conversationTitleDraft={controller.conversationTitleDraft}
                  onConversationTitleDraftChange={controller.onConversationTitleDraftChange}
                  onStartConversationRename={controller.onStartConversationRename}
                  onCommitConversationRename={controller.onCommitConversationRename}
                  onCancelConversationRename={controller.onCancelConversationRename}
                  onConversationPinToggle={controller.onConversationPinToggle}
                  onConversationDelete={controller.onConversationDelete}
                  onOpenConversation={controller.onOpenConversation}
                />
              </div>
            </div>
            ) : null}

            {(activeShelf === 'code' || activeShelf === 'project') && visibleShelfSet.has(activeShelf) ? (
              <CodeProjectCollectionShelfPages
                activeShelf={activeShelf}
                searchOpen={searchOpen}
                searchTerm={controller.searchTerm}
                onWorkshopOpenChange={controller.setCodeWorkshopOpen}
                onOpenCardsShelf={() => controller.setCollectionShelf('code')}
                onOpenDesktopLocalSettings={onOpenDesktopLocalSettings}
              />
            ) : null}

            {visibleShelfSet.has('image') && activeShelf === 'image' ? (
            <div
              className="collection-shelf-page collection-shelf-page--image collection-shelf-page--active"
              data-shelf-page="image"
            >
              <div className="collection-shelf-page-body">
                <ImageCollectionShelf
                  cardsExpanded={searchOpen}
                  searchTerm={controller.searchTerm}
                  isAggregateScope={controller.isAggregateScope}
                  floatingActionHost={floatingActionHost}
                />
              </div>
            </div>
            ) : null}
          </div>
        )}
        <div ref={setFloatingActionHost} className="collection-floating-action-host" />
        {controller.ready && activeShelf === 'dialogue' ? (
          <CollectionFloatingCreateAction
            label={t('collection.world.newConversation')}
            onPress={() => setShowNewConvDialog(true)}
          />
        ) : null}
        {showNewConvDialog ? (
          <div className="settings-overlay" onClick={() => setShowNewConvDialog(false)}>
            <div className="settings-sheet menu-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="menu-sheet-page">
                <div className="menu-sheet-header">
                  <button
                    type="button"
                    className="menu-sheet-back"
                    aria-label={t('common.back')}
                    onClick={() => setShowNewConvDialog(false)}
                  >
                    <span className="menu-sheet-back-icon"><Icon name="chevron" size={26} /></span>
                  </button>
                  <div className="menu-sheet-title">
                    <small>{t('common.newConversation')}</small>
                    <h2>选择模式</h2>
                  </div>
                </div>

                <div className="collaborator-scope-drawer-list" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={newConvMode === 'handoff'}
                    className={`collaborator-scope-card collaborator-scope-card--tool ${newConvMode === 'handoff' ? 'active' : ''}`}
                    onClick={() => setNewConvMode('handoff')}
                    style={{ width: '100%' }}
                  >
                    <span className="collaborator-scope-card-title">
                      <span className="collaborator-scope-card-badge">
                        <Icon name="navDialogue" size={18} />
                      </span>
                      <strong>带 Handoff</strong>
                    </span>
                    <span className="collaborator-scope-card-meta">
                      <span>注入钉选桶、最近记忆等上下文</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={newConvMode === 'clean'}
                    className={`collaborator-scope-card collaborator-scope-card--tool ${newConvMode === 'clean' ? 'active' : ''}`}
                    onClick={() => setNewConvMode('clean')}
                    style={{ width: '100%' }}
                  >
                    <span className="collaborator-scope-card-title">
                      <span className="collaborator-scope-card-badge">
                        <Icon name="plus" size={18} />
                      </span>
                      <strong>不带 Handoff</strong>
                    </span>
                    <span className="collaborator-scope-card-meta">
                      <span>干净启动，不注入历史记忆</span>
                    </span>
                  </button>
                </div>

                <section className="menu-section" style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewConvDialog(false);
                      if (newConvMode === 'clean') {
                        setSkipHandoffForNextRequest(true);
                      } else {
                        setForceHandoffForNextRequest();
                      }
                      controller.onCreateConversation();
                    }}
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
                    确认创建
                  </button>
                </section>
              </div>
            </div>
          </div>
        ) : null}
        <CollectionShelfTabs
          collectionShelf={controller.collectionShelf}
          navItems={visibleShelfItems}
          onSetCollectionShelf={controller.setCollectionShelf}
        />
      </div>
    </section>
  );
}
