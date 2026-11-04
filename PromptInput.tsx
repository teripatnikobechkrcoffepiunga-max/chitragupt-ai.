import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  ShieldCheck,
  X,
  FileText,
  Volume2,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Attachment } from '../types';
import { detectAndScrubPII } from '../utils/crypto';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';

interface PromptInputProps {
  onSendMessage: (content: string, attachments: Attachment[], anonymized: boolean) => void;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  piiScrubberEnabled: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  selectedLanguage,
  onLanguageChange,
  piiScrubberEnabled,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input, interimTranscript]);

  // Real-time PII check
  const piiAnalysis = React.useMemo(() => {
    if (!input || !piiScrubberEnabled) return null;
    return detectAndScrubPII(input);
  }, [input, piiScrubberEnabled]);

  const handleSubmit = useCallback(() => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) {
      return;
    }

    // If microphone is active, stop it
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    }

    let finalContent = input;
    let wasAnonymized = false;

    if (piiScrubberEnabled && piiAnalysis && piiAnalysis.hasRedactions) {
      finalContent = piiAnalysis.scrubbedText;
      wasAnonymized = true;
    }

    onSendMessage(finalContent, attachments, wasAnonymized);
    setInput('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, attachments, isGenerating, isListening, piiScrubberEnabled, piiAnalysis, onSendMessage]);

  // Web Speech API initialization with Real-Time hands-free handling
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      const langOption = getLanguageOption(selectedLanguage);
      recognition.lang = langOption.speechCode || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk) {
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setInterimTranscript('');

          // If hands-free mode is enabled, reset silence timer to auto-send
          if (handsFreeMode) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              handleSubmit();
            }, 1800);
          }
        } else {
          setInterimTranscript(interimChunk);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic access in your browser.');
        } else if (event.error === 'no-speech') {
          // Timeout with silence, keep alive if in hands-free
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed initializing Web Speech API:', err);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [selectedLanguage, handsFreeMode, handleSubmit]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported by your browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.warn('Stop speech error:', err);
      }
      setIsListening(false);
      setInterimTranscript('');
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } else {
      setSpeechError(null);
      setInterimTranscript('');
      try {
        const langOption = getLanguageOption(selectedLanguage);
        if (recognitionRef.current) {
          recognitionRef.current.lang = langOption.speechCode || 'en-US';
          recognitionRef.current.start();
        }
      } catch (err) {
        console.error('Start speech recognition failed:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          mimeType: file.type || 'text/plain',
          data: base64Data,
          size: file.size,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const currentLangOption = getLanguageOption(selectedLanguage);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3">
      {/* Real-Time Voice-To-Text Audio Visualizer Bar */}
      {isListening && (
        <div className="mb-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#2c1d3c] via-[#221832] to-[#1a1426] border border-[#f9a8d4]/50 shadow-lg soft-glow-pink flex items-center justify-between text-xs text-[#fcfbfe] animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            {/* Animated Audio Waveform Bars in Soft Light Pink & Soft Purple */}
            <div className="flex items-center gap-1 h-4">
              <span className="w-1 bg-[#f9a8d4] rounded-full animate-bounce h-3" />
              <span className="w-1 bg-[#fbcfe8] rounded-full animate-bounce h-5 [animation-delay:150ms]" />
              <span className="w-1 bg-[#f9a8d4] rounded-full animate-bounce h-2 [animation-delay:300ms]" />
              <span className="w-1 bg-[#bfa3f8] rounded-full animate-bounce h-6 [animation-delay:450ms]" />
              <span className="w-1 bg-[#f9a8d4] rounded-full animate-bounce h-3 [animation-delay:200ms]" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5 font-semibold text-[#f9a8d4] text-xs">
                <span>Listening in {currentLangOption.nativeName}</span>
                {handsFreeMode && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#f9a8d4]/20 text-[#f9a8d4] font-mono border border-[#f9a8d4]/40">
                    Hands-Free Auto-Send ON
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#e6e0ee] truncate font-mono">
                {interimTranscript ? `"${interimTranscript}"` : 'Speak naturally, speech converts in real-time...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-colors"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() && !interimTranscript.trim()}
              className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] text-[#121016] font-semibold text-xs shadow-md transition-all hover:brightness-105"
            >
              Send Voice
            </button>
          </div>
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-red-950/70 border border-red-700/50 text-red-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-red-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PII Detection Warning Banner */}
      {piiAnalysis && piiAnalysis.hasRedactions && (
        <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-[#261c33] border border-[#f9a8d4]/50 text-[#f9a8d4] text-xs flex items-center justify-between shadow-sm soft-glow-pink animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#f9a8d4]" />
            <span>
              <strong>Privacy Shield:</strong> {piiAnalysis.redactionsCount} sensitive item(s) (
              {piiAnalysis.detectedTypes.join(', ')}) will be anonymized client-side.
            </span>
          </div>
          <span className="text-[10px] text-[#f9a8d4] font-mono">E2EE Protected</span>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#1e182c] rounded-2xl border border-[#372b4c]">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-[#281f3a] rounded-xl text-xs text-[#e6e0ee] border border-[#3e2f56]"
            >
              {att.mimeType.startsWith('image/') ? (
                <img
                  src={att.data}
                  alt={att.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#f9a8d4]/40"
                />
              ) : (
                <FileText className="w-4 h-4 text-[#f9a8d4]" />
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating input box */}
      <div className="relative flex flex-col w-full rounded-2xl bg-[#1a1426] border border-[#35284b] shadow-xl focus-within:border-[#f9a8d4] focus-within:ring-2 focus-within:ring-[#f9a8d4]/30 transition-all soft-glow-pink">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? `Listening in ${currentLangOption.nativeName}... speak now`
              : 'Message Chitragupt...'
          }
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] text-[#fcfbfe] placeholder-[#a79cb5] focus:outline-none min-h-[52px] max-h-[200px]"
        />

        {/* Action bar inside input box */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools: Attachment, Multilingual & Hands-Free Selector */}
          <div className="flex items-center gap-1.5">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,text/*,.pdf,.doc,.docx,.json,.ts,.js,.py,.html"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-[#a79cb5] hover:text-[#fcfbfe] hover:bg-[#281f39] transition-colors"
              title="Attach images or documents"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Language Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-[#fcfbfe] bg-[#251e36] hover:bg-[#2f2545] transition-colors border border-[#3a2d52]"
                title="Change interaction language"
              >
                <Globe className="w-3.5 h-3.5 text-[#bfa3f8]" />
                <span>{currentLangOption.nativeName}</span>
              </button>

              {showLanguagePicker && (
                <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-[#1d172a] border border-[#3a2d52] shadow-2xl py-1.5 z-40">
                  <div className="px-3 py-1 text-[10px] font-bold text-[#bfa3f8] uppercase tracking-wider">
                    Interaction Language
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLanguagePicker(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#281f39] transition-colors ${
                          selectedLanguage === lang.code
                            ? 'text-[#f9a8d4] font-semibold bg-[#261d36]'
                            : 'text-[#e6e0ee]'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] text-[#a79cb5]">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hands-Free Mode Toggle */}
            <button
              type="button"
              onClick={() => setHandsFreeMode(!handsFreeMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-colors border ${
                handsFreeMode
                  ? 'bg-[#f9a8d4]/15 text-[#f9a8d4] border-[#f9a8d4]/40 font-medium'
                  : 'bg-[#251e36] text-[#a79cb5] hover:text-[#fcfbfe] border-[#382b4f]'
              }`}
              title={
                handsFreeMode
                  ? 'Hands-Free mode active: automatically sends when you pause speaking'
                  : 'Turn on Hands-Free voice interaction'
              }
            >
              <Radio className={`w-3.5 h-3.5 ${handsFreeMode ? 'text-[#f9a8d4] animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Hands-Free</span>
            </button>
          </div>

          {/* Right tools: Real-Time Web Speech Dictation & Send/Stop */}
          <div className="flex items-center gap-2">
            {/* Voice Dictation (Web Speech API) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-[#f9a8d4]/20 text-[#f9a8d4] shadow-md ring-2 ring-[#f9a8d4]/50'
                  : 'text-[#a79cb5] hover:text-[#fcfbfe] hover:bg-[#281f39]'
              }`}
              title={isListening ? 'Stop voice dictation' : `Dictate in ${currentLangOption.nativeName}`}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 text-[#f9a8d4] animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#f9a8d4] animate-ping" />
                </>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send or Stop Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-[#fcfbfe] text-[#121016] hover:bg-white flex items-center justify-center transition-transform active:scale-95 shadow-md soft-glow-pink"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] text-[#121016] hover:brightness-105 active:scale-95 cursor-pointer shadow-md soft-glow-pink'
                    : 'bg-[#291f3a] text-[#5e4b74] cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footnote disclaimer */}
      <div className="text-center mt-2 text-[11px] text-[#746087] flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#ec4899]" />
        <span>Chitragupt AI • Hands-Free Voice • AES-256 Client-Side E2EE Data Privacy</span>
      </div>
    </div>
  );
};
