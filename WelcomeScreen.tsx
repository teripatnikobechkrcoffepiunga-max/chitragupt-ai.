import React from 'react';
import { Globe, Lock, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { LOCALIZED_SUGGESTIONS, getLanguageOption } from '../utils/languages';

interface WelcomeScreenProps {
  selectedLanguage: string;
  onSelectPrompt: (prompt: string) => void;
  onOpenPrivacyModal: () => void;
  onOpenMemoryModal: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  selectedLanguage,
  onSelectPrompt,
  onOpenPrivacyModal,
  onOpenMemoryModal,
}) => {
  const langOption = getLanguageOption(selectedLanguage);
  const suggestions = LOCALIZED_SUGGESTIONS[selectedLanguage] || LOCALIZED_SUGGESTIONS['en'];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 max-w-3xl mx-auto w-full select-none">
      {/* Brand Logo & Title */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-5">
          {/* Logo with Soft Light Pink Glow Aura */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#f472b6] shadow-2xl soft-glow-pink-lg ring-4 ring-[#f472b6]/30 transform hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.jpg"
              alt="Chitragupt Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-[#f472b6] text-[#db2777] shadow-md soft-glow-pink">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-[#2b1440] via-[#6b21a8] to-[#db2777] bg-clip-text text-transparent">
          {langOption.sampleGreeting}
        </h1>
        <p className="text-xs md:text-sm text-[#67537b] max-w-lg leading-relaxed">
          Chitragupt AI — Omniscient wisdom, polyglot fluency, and uncompromising client-side data privacy.
        </p>

        {/* Feature Badges with soft pink & soft purple accents */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3e8ff] text-[#581c87] border border-[#d8b4fe] shadow-xs">
            <Globe className="w-3.5 h-3.5 text-[#9333ea]" />
            <span>50+ World Languages</span>
          </div>
          <button
            onClick={onOpenMemoryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fce7f3] text-[#9d174d] border border-[#fbcfe8] hover:border-[#f472b6] hover:bg-[#fbcfe8] transition-all shadow-xs"
          >
            <Brain className="w-3.5 h-3.5 text-[#db2777]" />
            <span>Ranked Custom Memories</span>
          </button>
          <button
            onClick={onOpenPrivacyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ede9fe] text-[#5b21b6] border border-[#c4b5fd] hover:bg-[#ddd6fe] transition-all shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>AES-256 E2EE Vault</span>
          </button>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group text-left p-4 rounded-2xl bg-white/90 hover:bg-[#faf5ff] border border-[#e2d5f1] hover:border-[#c084fc] transition-all flex flex-col justify-between shadow-xs hover:shadow-md active:scale-[0.99]"
          >
            <div>
              <div className="font-semibold text-xs md:text-sm text-[#2a173d] group-hover:text-[#7e22ce] transition-colors mb-1.5 flex items-center justify-between">
                <span>{item.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8c74a5] group-hover:text-[#7e22ce] transform group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#67537b] leading-normal line-clamp-2">
                {item.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
