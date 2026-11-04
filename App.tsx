import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { PromptInput } from './components/PromptInput';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PrivacyModal } from './components/PrivacyModal';
import { MemoryModal } from './components/MemoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import {
  Conversation,
  Message,
  Attachment,
  MemoryItem,
  PrivacySettings,
  UserProfile,
} from './types';
import { encryptData, decryptData } from './utils/crypto';
import { detectLanguageFromText } from './utils/languages';

const STORAGE_KEY_CONVERSATIONS = 'chitragupt_vault_conversations';
const STORAGE_KEY_MEMORIES = 'chitragupt_vault_memories';
const STORAGE_KEY_SETTINGS = 'chitragupt_settings';
const STORAGE_KEY_USER_PROFILE = 'chitragupt_user_profile';

export default function App() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [temporaryConversation, setTemporaryConversation] = useState<Conversation | null>(null);

  // Model & System Configuration
  const [model, setModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'chitragupt-reasoner'>('gemini-3.1-flash-lite');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'oled' | 'slate'>('dark');

  // Memory & Privacy
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    enableEncryption: true,
    enablePiiAnonymizer: true,
    autoDeleteDays: 0,
    strictNoTelemetry: true,
    incognitoByDefault: false,
  });

  // User & Authentication State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'google-user-1',
      name: 'Google User',
      email: 'teripatnikobechkrcoffepiunga@gmail.com',
      picture: 'https://api.dicebear.com/7.x/initials/svg?seed=GoogleUser&backgroundColor=bfa3f8,f9a8d4',
      isSignedIn: true,
      provider: 'google',
    };
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Persist User Profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to persist user profile:', e);
    }
  }, [userProfile]);

  // Abort controller for streaming cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load encrypted data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load settings
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.privacySettings) setPrivacySettings(parsed.privacySettings);
          if (parsed.selectedLanguage) setSelectedLanguage(parsed.selectedLanguage);
          if (parsed.customInstruction) setCustomInstruction(parsed.customInstruction);
          if (parsed.theme) setTheme(parsed.theme);
        }

        // Load memories from encrypted storage
        const encryptedMemories = localStorage.getItem(STORAGE_KEY_MEMORIES);
        if (encryptedMemories) {
          const decrypted = await decryptData(encryptedMemories);
          const parsedMemories = JSON.parse(decrypted);
          if (Array.isArray(parsedMemories)) {
            setMemories(parsedMemories);
          }
        } else {
          // Default initial memory to showcase capability
          setMemories([
            {
              id: 'init-1',
              content: 'User values data privacy, polyglot fluency, and concise high-quality answers.',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              category: 'preference',
              enabled: true,
              importance: 5,
              tags: ['privacy', 'languages', 'style'],
            },
          ]);
        }

        // Load conversations from encrypted storage
        const encryptedConversations = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
        if (encryptedConversations) {
          const decrypted = await decryptData(encryptedConversations);
          const parsedConversations: Conversation[] = JSON.parse(decrypted);

          if (Array.isArray(parsedConversations)) {
            // Apply auto-delete retention policy if configured
            const savedRetentionDays = savedSettings
              ? JSON.parse(savedSettings)?.privacySettings?.autoDeleteDays || 0
              : 0;

            let validConversations = parsedConversations;
            if (savedRetentionDays > 0) {
              const cutoffTime = Date.now() - savedRetentionDays * 24 * 60 * 60 * 1000;
              validConversations = parsedConversations.filter((c) => c.updatedAt > cutoffTime);
            }

            setConversations(validConversations);
            if (validConversations.length > 0) {
              setActiveConversationId(validConversations[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to decrypt and load stored conversations:', err);
      }
    };

    initializeData();
  }, []);

  // Save conversations to encrypted storage
  const saveConversationsToVault = useCallback(async (convs: Conversation[]) => {
    try {
      const serialized = JSON.stringify(convs);
      const encrypted = await encryptData(serialized);
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, encrypted);
    } catch (err) {
      console.error('Error saving encrypted conversations:', err);
    }
  }, []);

  // Save memories to encrypted storage
  const saveMemoriesToVault = useCallback(async (mems: MemoryItem[]) => {
    try {
      const serialized = JSON.stringify(mems);
      const encrypted = await encryptData(serialized);
      localStorage.setItem(STORAGE_KEY_MEMORIES, encrypted);
    } catch (err) {
      console.error('Error saving encrypted memories:', err);
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify({
        privacySettings,
        selectedLanguage,
        customInstruction,
        theme,
      })
    );
  }, [privacySettings, selectedLanguage, customInstruction, theme]);

  // Current active conversation
  const currentConversation: Conversation | null = isTemporaryChat
    ? temporaryConversation
    : conversations.find((c) => c.id === activeConversationId) || null;

  // New Chat handler
  const handleNewChat = () => {
    if (isTemporaryChat) {
      setTemporaryConversation(null);
      return;
    }

    const newConv: Conversation = {
      id: Math.random().toString(36).substring(7),
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: model,
      language: selectedLanguage,
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConv.id);
    saveConversationsToVault(updated);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations, isTemporaryChat, model, selectedLanguage]);

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversationsToVault(updated);
    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Pin toggle
  const handleTogglePinConversation = (id: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    );
    setConversations(updated);
    saveConversationsToVault(updated);
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    );
    setConversations(updated);
    saveConversationsToVault(updated);
  };

  // Clear current conversation messages
  const handleClearCurrentChat = () => {
    if (isTemporaryChat) {
      setTemporaryConversation(null);
      return;
    }
    if (!activeConversationId) return;

    const updated = conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: [] } : c
    );
    setConversations(updated);
    saveConversationsToVault(updated);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Core Send Message Logic with Streaming SSE
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    wasAnonymized: boolean = false
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    // Detect user message language
    const detectedLang = detectLanguageFromText(content);

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments,
      anonymized: wasAnonymized,
      detectedLanguage: detectedLang,
    };

    let targetConv: Conversation;

    if (isTemporaryChat) {
      targetConv = temporaryConversation || {
        id: 'temporary-chat',
        title: 'Temporary Incognito Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: model,
        isTemporary: true,
      };
    } else {
      let existingConv = conversations.find((c) => c.id === activeConversationId);
      if (!existingConv) {
        existingConv = {
          id: Math.random().toString(36).substring(7),
          title: content.slice(0, 36) || 'New conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          model: model,
          language: selectedLanguage,
        };
        setActiveConversationId(existingConv.id);
      } else if (existingConv.messages.length === 0) {
        existingConv.title = content.slice(0, 36);
      }
      targetConv = existingConv;
    }

    const updatedMessages = [...targetConv.messages, userMessage];
    const updatedConv = {
      ...targetConv,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    if (isTemporaryChat) {
      setTemporaryConversation(updatedConv);
    } else {
      const newConvs = conversations.some((c) => c.id === targetConv.id)
        ? conversations.map((c) => (c.id === targetConv.id ? updatedConv : c))
        : [updatedConv, ...conversations];
      setConversations(newConvs);
      saveConversationsToVault(newConvs);
    }

    // Scroll to bottom
    setTimeout(scrollToBottom, 50);

    // Create placeholder for Chitragupt model response
    const botMessageId = Math.random().toString(36).substring(7);
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      detectedLanguage: detectedLang,
    };

    const messagesWithPlaceholder = [...updatedMessages, initialBotMessage];
    const convWithPlaceholder = {
      ...updatedConv,
      messages: messagesWithPlaceholder,
    };

    if (isTemporaryChat) {
      setTemporaryConversation(convWithPlaceholder);
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConv.id ? convWithPlaceholder : c))
      );
    }

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Prioritize and rank active memories if not in temporary incognito mode
    let activeMemoryFacts: string[] = [];
    if (!isTemporaryChat && memories.length > 0) {
      const enabledMems = memories.filter((m) => m.enabled);
      const lowerContent = content.toLowerCase();
      // Tokenize prompt into significant words (3+ chars)
      const promptWords = lowerContent.split(/[\s,.;:!?\-+*/()[\]{}'"]+/).filter((w) => w.length > 2);

      const scoredMemories = enabledMems.map((mem) => {
        const importance = typeof mem.importance === 'number' ? mem.importance : 3;
        // Base score: 10 to 50 based on 1-5 star importance
        let score = importance * 10;

        // Tag matching boost (+25 for each matched tag)
        if (mem.tags && mem.tags.length > 0) {
          for (const tag of mem.tags) {
            const cleanTag = tag.toLowerCase().replace(/^#/, '');
            if (cleanTag && lowerContent.includes(cleanTag)) {
              score += 25;
            }
          }
        }

        // Keyword overlap boost (+5 for each word in memory content appearing in user prompt)
        const memWords = mem.content.toLowerCase().split(/[\s,.;:!?\-+*/()[\]{}'"]+/);
        let wordMatches = 0;
        for (const word of promptWords) {
          if (word.length > 3 && memWords.includes(word)) {
            wordMatches++;
          }
        }
        score += Math.min(wordMatches * 5, 20);

        // Recency boost: +0 to +5 for recent memories
        const ageHours = (Date.now() - (mem.updatedAt || mem.createdAt)) / (1000 * 60 * 60);
        if (ageHours < 24) score += 5;
        else if (ageHours < 168) score += 2;

        return { mem, score };
      });

      // Sort descending by calculated priority score
      scoredMemories.sort((a, b) => b.score - a.score);

      // Context window safeguard: prioritize top 8 most relevant/highest priority memories
      activeMemoryFacts = scoredMemories.slice(0, 8).map((item) => {
        const tagSuffix = item.mem.tags && item.mem.tags.length > 0
          ? ` [Tags: ${item.mem.tags.join(', ')}]`
          : '';
        return `[Importance ${item.mem.importance || 3}/5] ${item.mem.content}${tagSuffix}`;
      });
    }

    try {
      // Build request body for /api/chat/stream
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((att) => ({
          mimeType: att.mimeType,
          data: att.data,
          name: att.name,
        })),
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model:
            model === 'chitragupt-reasoner'
              ? 'gemini-3.8-flash'
              : model === 'gemini-3.8-flash'
              ? 'gemini-3.8-flash'
              : 'gemini-3.1-flash-lite',
          targetLanguage: selectedLanguage !== 'en' ? selectedLanguage : undefined,
          systemPromptCustom: customInstruction,
          activeMemories: activeMemoryFacts,
          enableReasoning: model === 'chitragupt-reasoner',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE event and data
          const eventMatch = line.match(/^event:\s*(\w+)/);
          const dataMatch = line.match(/data:\s*(.+)$/m);

          const eventType = eventMatch ? eventMatch[1] : 'message';
          const dataStr = dataMatch ? dataMatch[1] : '';

          if (eventType === 'content') {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.delta) {
                streamedContent += parsed.delta;
                // Update message content
                updateStreamingMessage(targetConv.id, botMessageId, streamedContent);
              }
            } catch (err) {
              console.warn('Failed parsing content delta:', err);
            }
          } else if (eventType === 'error') {
            try {
              const errParsed = JSON.parse(dataStr);
              streamedContent += `\n\n*(Error: ${errParsed.error})*`;
              updateStreamingMessage(targetConv.id, botMessageId, streamedContent, false, true);
            } catch {
              // fallback
            }
          } else if (eventType === 'done') {
            // Finished
          }
        }
      }

      // Finish streaming
      finalizeStreamingMessage(targetConv.id, botMessageId, streamedContent);

      // Trigger automatic memory discovery in background (only if NOT temporary mode)
      if (!isTemporaryChat && content.length > 10) {
        extractMemoryInBackground(content);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const errMsg = err instanceof Error ? err.message : 'Unknown network error';
        finalizeStreamingMessage(
          targetConv.id,
          botMessageId,
          `I apologize, an error occurred while connecting to the intelligence engine: ${errMsg}`
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Helper to update streaming response
  const updateStreamingMessage = (
    convId: string,
    msgId: string,
    content: string,
    isStreaming: boolean = true,
    isError: boolean = false
  ) => {
    const updateFn = (msgList: Message[]) =>
      msgList.map((m) =>
        m.id === msgId ? { ...m, content, isStreaming, isError } : m
      );

    if (isTemporaryChat) {
      setTemporaryConversation((prev) =>
        prev ? { ...prev, messages: updateFn(prev.messages) } : null
      );
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: updateFn(c.messages) } : c))
      );
    }
  };

  // Helper to finalize streaming response and encrypt to disk
  const finalizeStreamingMessage = (
    convId: string,
    msgId: string,
    finalContent: string
  ) => {
    const finalizeFn = (msgList: Message[]) =>
      msgList.map((m) =>
        m.id === msgId
          ? {
              ...m,
              content: finalContent,
              isStreaming: false,
              detectedLanguage: detectLanguageFromText(finalContent),
            }
          : m
      );

    if (isTemporaryChat) {
      setTemporaryConversation((prev) =>
        prev ? { ...prev, messages: finalizeFn(prev.messages) } : null
      );
    } else {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId ? { ...c, messages: finalizeFn(c.messages) } : c
        );
        saveConversationsToVault(next);
        return next;
      });
    }
  };

  // Background memory extractor
  const extractMemoryInBackground = async (userPrompt: string) => {
    try {
      const res = await fetch('/api/chat/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          previousMemories: memories.map((m) => m.content),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hasMemory && data.memory) {
          const newMem: MemoryItem = {
            id: Math.random().toString(36).substring(7),
            content: data.memory,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            category: 'fact',
            enabled: true,
            importance: 3,
            tags: ['auto-recalled'],
          };
          setMemories((prev) => {
            const next = [newMem, ...prev];
            saveMemoriesToVault(next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('Memory extraction background task error:', err);
    }
  };

  // In-line Translation handler
  const handleTranslateMessage = async (messageId: string, targetLanguageName: string) => {
    if (!currentConversation) return;

    const targetMsg = currentConversation.messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.content) return;

    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetMsg.content,
          targetLanguage: targetLanguageName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          const translatedContent = `${targetMsg.content}\n\n---\n**[${targetLanguageName} Translation]:**\n\n${data.translatedText}`;
          const updatedMessages = currentConversation.messages.map((m) =>
            m.id === messageId ? { ...m, content: translatedContent } : m
          );

          if (isTemporaryChat) {
            setTemporaryConversation((prev) =>
              prev ? { ...prev, messages: updatedMessages } : null
            );
          } else {
            const updatedConvs = conversations.map((c) =>
              c.id === currentConversation.id ? { ...c, messages: updatedMessages } : c
            );
            setConversations(updatedConvs);
            saveConversationsToVault(updatedConvs);
          }
        }
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
  };

  // Regenerate last model response
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;

    // Find last user message
    const msgs = currentConversation.messages;
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const actualIdx = msgs.length - 1 - lastUserIdx;
    const userMsg = msgs[actualIdx];

    // Truncate to just before the last model response
    const truncated = msgs.slice(0, actualIdx);
    const updatedConv = { ...currentConversation, messages: truncated };

    if (isTemporaryChat) {
      setTemporaryConversation(updatedConv);
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConversation.id ? updatedConv : c))
      );
    }

    handleSendMessage(userMsg.content, userMsg.attachments || [], userMsg.anonymized || false);
  };

  // Memory operations with ranking and tags
  const handleAddMemory = (
    content: string,
    category: MemoryItem['category'] = 'fact',
    importance: number = 3,
    tags: string[] = []
  ) => {
    const newMem: MemoryItem = {
      id: Math.random().toString(36).substring(7),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category,
      enabled: true,
      importance,
      tags,
    };
    const updated = [newMem, ...memories];
    setMemories(updated);
    saveMemoriesToVault(updated);
  };

  const handleUpdateMemory = (
    id: string,
    newContent: string,
    importance?: number,
    tags?: string[]
  ) => {
    const updated = memories.map((m) =>
      m.id === id
        ? {
            ...m,
            content: newContent,
            updatedAt: Date.now(),
            ...(importance !== undefined ? { importance } : {}),
            ...(tags !== undefined ? { tags } : {}),
          }
        : m
    );
    setMemories(updated);
    saveMemoriesToVault(updated);
  };

  const handleToggleMemory = (id: string) => {
    const updated = memories.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    setMemories(updated);
    saveMemoriesToVault(updated);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    saveMemoriesToVault(updated);
  };

  const handleClearAllMemories = () => {
    setMemories([]);
    saveMemoriesToVault([]);
  };

  // Privacy: Clear all data
  const handleClearAllData = () => {
    localStorage.removeItem(STORAGE_KEY_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEY_MEMORIES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    setConversations([]);
    setActiveConversationId(null);
    setMemories([]);
    setTemporaryConversation(null);
  };

  // Theme styling in soft purple light palette
  const getThemeClass = () => {
    switch (theme) {
      case 'oled':
        return 'bg-[#f4edf9] text-[#251239]';
      case 'slate':
        return 'bg-[#f2eaf7] text-[#251239]';
      default:
        return 'bg-[#f8f3fd] text-[#251239]';
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${getThemeClass()} font-['Plus_Jakarta_Sans',sans-serif] relative`}>
      {/* Soft purple and soft light pink atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-[480px] h-[480px] bg-[#e9d5ff]/50 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-20 w-[420px] h-[420px] bg-[#fce7f3]/60 rounded-full blur-[110px]" />
        <div className="absolute -bottom-24 right-1/3 w-[400px] h-[400px] bg-[#ede9fe]/50 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          if (isTemporaryChat) setIsTemporaryChat(false);
          setActiveConversationId(id);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onRenameConversation={handleRenameConversation}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        memoryCount={memories.filter((m) => m.enabled).length}
        isTemporaryChat={isTemporaryChat}
        userProfile={userProfile}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          currentConversation={currentConversation}
          onNewChat={handleNewChat}
          onClearChat={handleClearCurrentChat}
          isTemporaryChat={isTemporaryChat}
          onToggleTemporaryChat={() => {
            setIsTemporaryChat(!isTemporaryChat);
            if (!isTemporaryChat) {
              setTemporaryConversation(null);
            }
          }}
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          memoryCount={memories.filter((m) => m.enabled).length}
          model={model}
          onModelChange={setModel}
          userProfile={userProfile}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Center Messages / Welcome Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <WelcomeScreen
              selectedLanguage={selectedLanguage}
              onSelectPrompt={(p) => handleSendMessage(p, [], false)}
              onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
              onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
            />
          ) : (
            <div className="flex-1 py-4">
              {currentConversation.messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onRegenerate={handleRegenerate}
                  onTranslate={handleTranslateMessage}
                  isStreaming={message.isStreaming}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Floating Prompt Bar */}
        <PromptInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          piiScrubberEnabled={privacySettings.enablePiiAnonymizer}
        />
      </div>

      {/* Modals */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        privacySettings={privacySettings}
        onUpdatePrivacySettings={(newS) => setPrivacySettings((prev) => ({ ...prev, ...newS }))}
        conversations={conversations}
        onClearAllData={handleClearAllData}
      />

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onToggleMemory={handleToggleMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        customInstruction={customInstruction}
        onSaveCustomInstruction={setCustomInstruction}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        theme={theme}
        onThemeChange={setTheme}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        onSignOut={() =>
          setUserProfile({
            id: 'guest',
            name: 'Guest User',
            email: '',
            isSignedIn: false,
            provider: 'guest',
          })
        }
      />
    </div>
  );
}
