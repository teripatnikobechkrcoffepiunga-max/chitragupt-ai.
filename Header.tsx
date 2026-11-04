import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  Ghost,
  Sparkles,
  Share2,
  Trash2,
  Brain,
  Lock,
  Check,
  User,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  currentConversation: Conversation | null;
  onNewChat: () => void;
  onClearChat: () => void;
  isTemporaryChat: boolean;
  onToggleTemporaryChat: () => void;
  onOpenPrivacyModal: () => void;
  onOpenMemoryModal: () => void;
  memoryCount: number;
  model: 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'chitragupt-reasoner';
  onModelChange: (model: 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'chitragupt-reasoner') => void;
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentConversation,
  onClearChat,
  isTemporaryChat,
  onToggleTemporaryChat,
  onOpenPrivacyModal,
  onOpenMemoryModal,
  memoryCount,
  model,
  onModelChange,
  userProfile,
  onOpenAuthModal,
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const getModelLabel = () => {
    switch (model) {
      case 'chitragupt-reasoner':
        return 'Chitragupt Deep Reasoner';
      case 'gemini-3.8-flash':
        return 'Chitragupt 3.8 Flash';
      default:
        return 'Chitragupt Omni (World Memory)';
    }
  };

  const handleShare = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const conversationText = currentConversation.messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Chitragupt'}: ${m.content}`)
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(conversationText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <header className="h-14 border-b border-[#e2d5f0] bg-[#f7f2fc]/95 backdrop-blur-md flex items-center justify-between px-3 md:px-4 z-20 select-none">
      {/* Left section: Hamburger, Logo, & Model Dropdown */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#67537d] hover:text-[#9333ea] hover:bg-[#eee4f8] transition-colors"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small Logo with soft pink glow */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#f472b6] shadow-sm soft-glow-pink ring-2 ring-[#f472b6]/30">
            <img src="/logo.jpg" alt="Chitragupt AI" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-[#faf6fe] border border-[#d8c5ee] hover:border-[#c084fc] transition-all font-semibold text-xs md:text-sm text-[#2a173d] shadow-xs"
          >
            <span>{getModelLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9333ea]" />
          </button>

          {showModelDropdown && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-white border border-[#d8c5ee] shadow-2xl p-2 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  onModelChange('gemini-3.1-flash-lite');
                  setShowModelDropdown(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-3 ${
                  model === 'gemini-3.1-flash-lite'
                    ? 'bg-[#f3e8ff] text-[#581c87] border border-[#d8b4fe]'
                    : 'text-[#2a173d] hover:bg-[#faf5ff]'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#e9d5ff] text-[#7e22ce] mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#2a173d]">Chitragupt Omni (World Memory)</div>
                  <div className="text-[11px] text-[#6b557f] leading-normal">
                    Ultra-fast response with complete 16-domain world knowledge pre-indexed.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onModelChange('gemini-3.8-flash');
                  setShowModelDropdown(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-3 mt-1 ${
                  model === 'gemini-3.8-flash'
                    ? 'bg-[#fce7f3] text-[#9d174d] border border-[#fbcfe8]'
                    : 'text-[#2a173d] hover:bg-[#faf5ff]'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#fce7f3] text-[#db2777] mt-0.5">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#2a173d]">Chitragupt 3.8 Flash</div>
                  <div className="text-[11px] text-[#6b557f] leading-normal">
                    Advanced linguistic nuance, creative writing, and multilingual depth.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onModelChange('chitragupt-reasoner');
                  setShowModelDropdown(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-3 mt-1 ${
                  model === 'chitragupt-reasoner'
                    ? 'bg-[#ede9fe] text-[#5b21b6] border border-[#c4b5fd]'
                    : 'text-[#2a173d] hover:bg-[#faf5ff]'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#ede9fe] text-[#7c3aed] mt-0.5">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#2a173d]">Chitragupt Deep Reasoner</div>
                  <div className="text-[11px] text-[#6b557f] leading-normal">
                    High cognitive thinking level for complex math, STEM, and full-stack systems.
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Incognito, Custom Memory, Privacy, Google Sign-In */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Temporary / Incognito Chat Toggle */}
        <button
          onClick={onToggleTemporaryChat}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isTemporaryChat
              ? 'bg-[#fce7f3] text-[#be185d] border border-[#f472b6] shadow-xs'
              : 'text-[#67537d] hover:text-[#9333ea] hover:bg-[#eee4f8]'
          }`}
          title={isTemporaryChat ? 'Temporary Chat Active (No history stored)' : 'Toggle Temporary Chat'}
        >
          <Ghost className={`w-3.5 h-3.5 ${isTemporaryChat ? 'text-[#be185d]' : ''}`} />
          <span className="hidden sm:inline">
            {isTemporaryChat ? 'Incognito' : 'Temporary'}
          </span>
        </button>

        {/* Custom Memory Modal Trigger */}
        <button
          onClick={onOpenMemoryModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#2a173d] hover:bg-[#eee4f8] border border-[#ddcbf0] bg-white/70 shadow-xs transition-all"
          title="Custom Memory Ledger & Rankings"
        >
          <Brain className="w-3.5 h-3.5 text-[#a855f7]" />
          <span className="hidden sm:inline">Memories</span>
          {memoryCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#fce7f3] text-[#db2777] font-bold border border-[#fbcfe8]">
              {memoryCount}
            </span>
          )}
        </button>

        {/* Privacy Shield */}
        <button
          onClick={onOpenPrivacyModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#f3e8ff] text-[#7e22ce] hover:bg-[#ede9fe] border border-[#d8b4fe] transition-all shadow-xs"
          title="Data Privacy & AES-256 E2EE Hub"
        >
          <Lock className="w-3 h-3 text-[#7e22ce]" />
          <span className="hidden md:inline">E2EE Privacy</span>
        </button>

        {/* Share Button */}
        {currentConversation && currentConversation.messages.length > 0 && (
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-[#67537d] hover:text-[#9333ea] hover:bg-[#eee4f8] transition-colors"
            title="Copy conversation transcript"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-[#9333ea]" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Clear Current Chat */}
        {currentConversation && currentConversation.messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="p-2 rounded-xl text-[#67537d] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Clear current messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Real Working Google Sign In / Account Avatar Button */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white hover:bg-[#faf5ff] border border-[#d8c5ee] hover:border-[#c084fc] transition-all shadow-xs"
          title={userProfile.isSignedIn ? `Signed in as ${userProfile.name}` : 'Sign in with Google'}
        >
          {userProfile.isSignedIn && userProfile.picture ? (
            <img
              src={userProfile.picture}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full border border-[#f472b6] object-cover ring-1 ring-[#f472b6]/30"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#f472b6] via-[#fbcfe8] to-[#c084fc] flex items-center justify-center text-[#2a173d] text-[10px] font-bold">
              {/* Google G icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
          )}
          <span className="hidden sm:inline text-xs font-semibold text-[#2a173d]">
            {userProfile.isSignedIn ? userProfile.name.split(' ')[0] : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
};
