export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thought?: string;
  isStreaming?: boolean;
  isError?: boolean;
  anonymized?: boolean;
  originalRedactions?: Record<string, string>;
  detectedLanguage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  isTemporary?: boolean;
  model: 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'chitragupt-reasoner';
  language?: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  category: 'preference' | 'fact' | 'work' | 'instruction' | 'project' | 'custom';
  enabled: boolean;
  importance: number; // 1 to 5 (5 = Critical/Highest priority, 1 = Low)
  tags: string[];     // e.g. ['coding', 'privacy', 'profile', 'react']
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isSignedIn: boolean;
  provider: 'google' | 'guest';
}

export interface PrivacySettings {
  enableEncryption: boolean;
  enablePiiAnonymizer: boolean;
  autoDeleteDays: number; // 0 = keep forever, 1 = 24h, 7 = 7d, 30 = 30d
  strictNoTelemetry: boolean;
  incognitoByDefault: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  sampleGreeting: string;
}
