import React, { useState } from 'react';
import { X, Settings, Sliders, Volume2, Globe, Palette, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customInstruction: string;
  onSaveCustomInstruction: (instruction: string) => void;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  theme: 'dark' | 'oled' | 'slate';
  onThemeChange: (theme: 'dark' | 'oled' | 'slate') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customInstruction,
  onSaveCustomInstruction,
  selectedLanguage,
  onLanguageChange,
  theme,
  onThemeChange,
}) => {
  const [instructionText, setInstructionText] = useState(customInstruction);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCustomInstruction(instructionText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#1a1526] border border-[#362a4a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#e6e0ee]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d233e] bg-[#161221]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#f9a8d4]/15 text-[#f9a8d4] border border-[#f9a8d4]/30 soft-glow-pink">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#fcfbfe]">Chitragupt Settings</h2>
              <p className="text-xs text-[#a79cb5]">Personalize persona, language, and theme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#f9a8d4] hover:bg-[#282035] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#e6e0ee]">
          {/* Custom System Instructions */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-semibold text-[#fcfbfe] text-xs">
              <Sparkles className="w-4 h-4 text-[#f9a8d4]" />
              <span>Custom Instructions for Chitragupt</span>
            </div>
            <p className="text-xs text-[#a79cb5] mb-2">
              Provide background on how you like Chitragupt to think, code, or communicate:
            </p>
            <textarea
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              rows={4}
              placeholder="e.g. 'I prefer concise answers with practical code examples. Always explain subtle trade-offs.'"
              className="w-full bg-[#15111e] border border-[#352749] rounded-xl p-3 text-xs text-[#fcfbfe] placeholder-neutral-500 focus:outline-none focus:border-[#f9a8d4] focus:ring-1 focus:ring-[#f9a8d4]/30"
            />
          </div>

          {/* Primary Language */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-semibold text-[#fcfbfe] text-xs">
              <Globe className="w-4 h-4 text-[#f9a8d4]" />
              <span>Primary Interaction Language</span>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full bg-[#15111e] border border-[#352749] rounded-xl px-3 py-2 text-xs text-[#fcfbfe] focus:outline-none focus:border-[#f9a8d4]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#fcfbfe] text-xs">
              <Palette className="w-4 h-4 text-[#f9a8d4]" />
              <span>Visual Theme</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[
                { id: 'dark', label: 'Soft Pink-Vibe Dark' },
                { id: 'oled', label: 'Midnight OLED' },
                { id: 'slate', label: 'Deep Slate' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    theme === t.id
                      ? 'border-[#f9a8d4] bg-[#f9a8d4]/15 text-[#f9a8d4] font-semibold soft-glow-pink'
                      : 'border-[#332647] bg-[#1a1426] text-[#a79cb5] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#2d233e] bg-[#161221] flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[#a79cb5] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] text-[#121016] font-semibold hover:brightness-105 transition-all shadow-md soft-glow-pink"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
