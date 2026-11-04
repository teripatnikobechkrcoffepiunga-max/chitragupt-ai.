import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Globe,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Brain,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onTranslate?: (messageId: string, targetLang: string) => void;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onTranslate,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThoughtOpen, setIsThoughtOpen] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message.content);
    // Find voice matching language if possible
    const langOption = getLanguageOption(message.detectedLanguage || 'en');
    utterance.lang = langOption.speechCode || 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleThumbsUp = () => {
    if (feedback === 'up') {
      setFeedback(null);
    } else {
      setFeedback('up');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleThumbsDown = () => {
    setFeedback(feedback === 'down' ? null : 'down');
  };

  return (
    <div
      className={`group w-full py-4 px-4 md:px-6 transition-colors ${
        isUser ? 'bg-[#ede4f7]/60 border-b border-[#e2d4f2]' : 'bg-white/70 border-b border-[#eadcf5]'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3.5 md:gap-4 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9333ea] to-[#ec4899] border border-[#f472b6]/40 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#f472b6] shadow-md soft-glow-pink ring-2 ring-[#f472b6]/30">
              <img src="/logo.jpg" alt="Chitragupt Logo" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs md:text-sm font-semibold text-[#271439]">
              {isUser ? 'You' : 'Chitragupt'}
            </span>

            {/* Privacy Anonymized badge */}
            {isUser && message.anonymized && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8]"
                title="Sensitive PII masked client-side"
              >
                <ShieldCheck className="w-3 h-3 text-[#db2777]" />
                PII Protected
              </span>
            )}

            {/* Timestamp */}
            <span className="text-[11px] text-[#7e6992] ml-auto">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Attachments preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#d8c5ee] text-xs text-[#2a173d] shadow-2xs"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded ring-1 ring-[#f472b6]/40"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-[#db2777]" />
                  )}
                  <span className="max-w-[140px] truncate">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reasoning / Thinking Drawer if present */}
          {!isUser && message.thought && (
            <div className="mb-3 rounded-xl border border-[#d8c5ee] bg-white overflow-hidden shadow-xs">
              <button
                onClick={() => setIsThoughtOpen(!isThoughtOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#2a173d] hover:text-[#9333ea] hover:bg-[#faf5ff] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-[#9333ea]" />
                  <span>Thinking Process</span>
                </div>
                {isThoughtOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#7e6992]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#7e6992]" />
                )}
              </button>
              {isThoughtOpen && (
                <div className="px-3.5 py-2.5 text-xs text-[#3f2759] border-t border-[#e2d5f1] font-mono leading-relaxed whitespace-pre-wrap bg-[#faf6fe]">
                  {message.thought}
                </div>
              )}
            </div>
          )}

          {/* Main Message Content */}
          {isUser ? (
            <div className="text-[15px] leading-relaxed text-[#28153b] whitespace-pre-wrap select-text">
              {message.content}
            </div>
          ) : (
            <div className="relative text-[#28153b]">
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#ec4899] animate-pulse rounded-sm align-middle soft-glow-pink" />
              )}
            </div>
          )}

          {/* Action Bar (Copy, TTS, Translate, Feedback, Regenerate) */}
          {!isStreaming && (
            <div className="flex items-center gap-1.5 mt-3 pt-1 text-[#746087]">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-[#ede1f7] hover:text-[#9333ea] transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#9333ea]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Text to Speech */}
              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg hover:bg-[#ede1f7] transition-colors ${
                  isSpeaking ? 'text-[#db2777] bg-[#fce7f3]' : 'hover:text-[#9333ea]'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* In-chat Translate to other languages */}
              {!isUser && onTranslate && (
                <div className="relative">
                  <button
                    onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                    className="p-1.5 rounded-lg hover:bg-[#ede1f7] hover:text-[#9333ea] transition-colors flex items-center gap-1 text-xs"
                    title="Translate this response"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Translate</span>
                  </button>

                  {showTranslateMenu && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-44 rounded-xl bg-white border border-[#d8c5ee] shadow-2xl py-1 z-30">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#9333ea] uppercase tracking-wider">
                        Translate to
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setShowTranslateMenu(false);
                              onTranslate(message.id, lang.name);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#2a173d] hover:bg-[#f6f0fc] hover:text-[#9333ea] flex items-center justify-between"
                          >
                            <span>{lang.nativeName}</span>
                            <span className="text-[10px] text-[#7e6992]">{lang.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Regenerate (for model responses) */}
              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-[#ede1f7] hover:text-[#9333ea] transition-colors"
                  title="Regenerate response"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}

              {/* Thumbs Up / Down */}
              {!isUser && (
                <>
                  <button
                    onClick={handleThumbsUp}
                    className={`p-1.5 rounded-lg hover:bg-[#ede1f7] transition-colors ${
                      feedback === 'up' ? 'text-[#db2777]' : 'hover:text-[#2a173d]'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleThumbsDown}
                    className={`p-1.5 rounded-lg hover:bg-[#ede1f7] transition-colors ${
                      feedback === 'down' ? 'text-red-500' : 'hover:text-[#2a173d]'
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
