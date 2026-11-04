import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Brain,
  Settings,
  Globe,
  Ghost,
  ChevronLeft,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onTogglePinConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenPrivacyModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenSettingsModal: () => void;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  memoryCount: number;
  isTemporaryChat: boolean;
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePinConversation,
  onRenameConversation,
  onOpenPrivacyModal,
  onOpenMemoryModal,
  onOpenSettingsModal,
  selectedLanguage,
  onLanguageChange,
  memoryCount,
  isTemporaryChat,
  userProfile,
  onOpenAuthModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  // Group unpinned conversations by time
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todayList = unpinnedConversations.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayList = unpinnedConversations.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const last7DaysList = unpinnedConversations.filter(
    (c) => now - c.updatedAt >= 2 * oneDay && now - c.updatedAt < sevenDays
  );
  const olderList = unpinnedConversations.filter((c) => now - c.updatedAt >= sevenDays);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-[10px] font-bold text-[#f9a8d4] uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-0.5 mt-1">
          {list.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = conv.id === editingId;

            return (
              <div
                key={conv.id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#291b34] text-[#fcfbfe] font-semibold border border-[#f9a8d4]/40 shadow-xs soft-glow-pink'
                    : 'text-[#a79cb5] hover:bg-[#20182b] hover:text-[#fcfbfe]'
                }`}
                onClick={() => {
                  if (!isEditing) {
                    onSelectConversation(conv.id);
                  }
                }}
              >
                {/* Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#f9a8d4]' : 'text-[#a79cb5]'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full bg-[#14111c] border border-[#f9a8d4] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{conv.title || 'New conversation'}</span>
                  )}
                </div>

                {/* Actions on hover */}
                {isEditing ? (
                  <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => saveRename(conv.id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`items-center gap-1 ml-1 ${
                      isActive ? 'flex' : 'hidden group-hover:flex'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onTogglePinConversation(conv.id)}
                      className={`p-1 rounded hover:bg-[#34294a] transition-colors ${
                        conv.isPinned ? 'text-[#f9a8d4]' : 'text-[#a79cb5] hover:text-white'
                      }`}
                      title={conv.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startRename(conv)}
                      className="p-1 rounded text-[#a79cb5] hover:text-white hover:bg-[#34294a] transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteConversation(conv.id)}
                      className="p-1 rounded text-[#a79cb5] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const currentLang = getLanguageOption(selectedLanguage);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-[#15111e] border-r border-[#2d223c] flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-[#261d33]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#f9a8d4]/70 shadow-sm soft-glow-pink ring-2 ring-[#f9a8d4]/20 flex-shrink-0">
                <img src="/logo.jpg" alt="Chitragupt Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-[#fcfbfe] tracking-tight text-sm block leading-tight">
                  Chitragupt AI
                </span>
                <span className="text-[10px] text-[#f9a8d4] font-medium block">
                  चित्रागुप्त • Privacy Intelligence
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] text-[#121016] font-semibold text-xs shadow-md hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New conversation</span>
            </div>
            <span className="text-[10px] bg-[#121016]/15 px-1.5 py-0.5 rounded text-[#121016] font-mono font-bold">
              Ctrl+K
            </span>
          </button>

          {/* Search Box */}
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#a79cb5]" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1628] border border-[#312542] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#fcfbfe] placeholder-neutral-500 focus:outline-none focus:border-[#f9a8d4] focus:ring-1 focus:ring-[#f9a8d4]/30"
            />
          </div>
        </div>

        {/* Incognito Notice Banner if active */}
        {isTemporaryChat && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-[#f9a8d4]/15 border border-[#f9a8d4]/40 text-xs text-[#f9a8d4] flex items-center gap-2 soft-glow-pink">
            <Ghost className="w-4 h-4 flex-shrink-0" />
            <span>Incognito: Zero records stored.</span>
          </div>
        )}

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {renderConversationGroup('Pinned', pinnedConversations)}
          {renderConversationGroup('Today', todayList)}
          {renderConversationGroup('Yesterday', yesterdayList)}
          {renderConversationGroup('Previous 7 Days', last7DaysList)}
          {renderConversationGroup('Older', olderList)}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-[#a79cb5] text-xs">
              No conversations yet. Start a new chat!
            </div>
          )}
        </div>

        {/* Bottom Utility Bar */}
        <div className="p-2.5 border-t border-[#261d33] bg-[#13101c] space-y-1">
          {/* User Account Google Card */}
          <button
            onClick={onOpenAuthModal}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#1d1629] hover:bg-[#271d37] border border-[#342749] hover:border-[#f9a8d4]/40 transition-all text-left shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {userProfile.isSignedIn && userProfile.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-full border border-[#f9a8d4] object-cover ring-1 ring-[#f9a8d4]/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] flex items-center justify-center text-[#121016] text-[10px] font-bold">
                  G
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#fcfbfe] truncate">
                  {userProfile.isSignedIn ? userProfile.name : 'Sign in with Google'}
                </div>
                <div className="text-[10px] text-[#f9a8d4] truncate">
                  {userProfile.isSignedIn ? userProfile.email : 'Sync with Google Account'}
                </div>
              </div>
            </div>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[#a79cb5] hover:text-[#f9a8d4] hover:bg-[#1f172c] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#f9a8d4]" />
                <span>Language</span>
              </div>
              <span className="text-[11px] text-[#f9a8d4] font-medium">
                {currentLang.nativeName}
              </span>
            </button>

            {showLanguageDropdown && (
              <div className="absolute left-0 bottom-full mb-1 w-full rounded-2xl bg-[#1d1629] border border-[#392b4d] shadow-2xl p-1 z-50 max-h-52 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-[#f9a8d4] uppercase">
                  Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      selectedLanguage === lang.code
                        ? 'bg-[#2f1f3a] text-[#f9a8d4] font-semibold'
                        : 'text-[#e6e0ee] hover:bg-[#251b34]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-[#a79cb5]">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Memory Modal Trigger */}
          <button
            onClick={onOpenMemoryModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[#a79cb5] hover:text-[#fcfbfe] hover:bg-[#1f172c] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-[#f9a8d4]" />
              <span>Custom Memories</span>
            </div>
            {memoryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#f9a8d4]/20 text-[#f9a8d4] font-bold border border-[#f9a8d4]/30">
                {memoryCount}
              </span>
            )}
          </button>

          {/* Privacy Hub Trigger */}
          <button
            onClick={onOpenPrivacyModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[#a79cb5] hover:text-[#fcfbfe] hover:bg-[#1f172c] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#f9a8d4]" />
              <span>Privacy Hub</span>
            </div>
            <span className="text-[10px] text-[#f9a8d4] font-mono">AES-256</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettingsModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[#a79cb5] hover:text-[#fcfbfe] hover:bg-[#1f172c] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-[#a79cb5]" />
              <span>Settings</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
