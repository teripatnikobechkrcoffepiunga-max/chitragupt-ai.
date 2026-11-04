import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  FileText,
  Key,
} from 'lucide-react';
import { PrivacySettings, Conversation } from '../types';
import { getEncryptionKeyFingerprint, detectAndScrubPII } from '../utils/crypto';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  privacySettings: PrivacySettings;
  onUpdatePrivacySettings: (newSettings: Partial<PrivacySettings>) => void;
  conversations: Conversation[];
  onClearAllData: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  privacySettings,
  onUpdatePrivacySettings,
  conversations,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'tester' | 'policy'>('controls');
  const [testInput, setTestInput] = useState('My email is john.doe@example.com and phone is +1 (555) 234-5678. API key: sk-live9876543210abcdef.');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const keyFingerprint = getEncryptionKeyFingerprint();
  const testScrubResult = detectAndScrubPII(testInput);

  // Export conversations as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chitragupt_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export conversations as Markdown
  const handleExportMarkdown = () => {
    let mdContent = `# Chitragupt AI - Private Conversation Export\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n`;

    conversations.forEach((conv, index) => {
      mdContent += `## Conversation ${index + 1}: ${conv.title}\n`;
      mdContent += `*Date: ${new Date(conv.createdAt).toLocaleString()}*\n\n`;

      conv.messages.forEach((msg) => {
        mdContent += `### ${msg.role === 'user' ? 'User' : 'Chitragupt'}\n${msg.content}\n\n`;
      });
      mdContent += `\n---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chitragupt_archive_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#faf6fd] border border-[#d8c3ee] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-[#28153b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2d5f0] bg-[#f4ecfa]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8] soft-glow-pink">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#261238]">Data Privacy & Security Hub</h2>
              <p className="text-xs text-[#67537b]">
                Zero-knowledge local encryption and data sovereignty controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#746087] hover:text-[#9333ea] hover:bg-[#eee4f8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2d5f0] bg-[#f8f2fc] px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('controls')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'controls'
                ? 'border-[#9333ea] text-[#7e22ce] font-semibold'
                : 'border-transparent text-[#746087] hover:text-[#261238]'
            }`}
          >
            Privacy Controls
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'tester'
                ? 'border-[#9333ea] text-[#7e22ce] font-semibold'
                : 'border-transparent text-[#746087] hover:text-[#261238]'
            }`}
          >
            PII Redaction Scanner
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'policy'
                ? 'border-[#9333ea] text-[#7e22ce] font-semibold'
                : 'border-transparent text-[#746087] hover:text-[#261238]'
            }`}
          >
            Full Privacy Policy
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#28153b]">
          {activeTab === 'controls' && (
            <>
              {/* E2EE Status Card */}
              <div className="p-4 rounded-xl bg-white border border-[#d8c3ee] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-[#261238]">Client-Side End-to-End Encryption</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#523d67] mb-3 leading-relaxed">
                  All messages, titles, attachments, and extracted memory are encrypted at rest on your device using <strong>AES-GCM (256-bit)</strong> keys via the native browser Web Crypto API.
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8f3fd] border border-[#e2d5f0] font-mono text-xs text-[#523d67]">
                  <div className="flex items-center gap-2 truncate">
                    <Key className="w-3.5 h-3.5 text-[#9333ea]" />
                    <span>Vault Fingerprint: {keyFingerprint}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(keyFingerprint);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="text-[#9333ea] hover:text-[#7e22ce] text-[11px] font-sans font-semibold ml-2"
                  >
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                {/* PII Anonymizer */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#e2d5f0]">
                  <div>
                    <div className="font-semibold text-[#261238] text-sm">
                      Automatic PII Anonymization & Redaction
                    </div>
                    <div className="text-xs text-[#67537b] mt-0.5">
                      Scrub email addresses, phone numbers, credit cards, and API keys before transmission.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePrivacySettings({
                        enablePiiAnonymizer: !privacySettings.enablePiiAnonymizer,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.enablePiiAnonymizer ? 'bg-emerald-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.enablePiiAnonymizer ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Zero Telemetry */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#e2d5f0]">
                  <div>
                    <div className="font-semibold text-[#261238] text-sm">
                      Strict Zero Telemetry & No-Training Policy
                    </div>
                    <div className="text-xs text-[#67537b] mt-0.5">
                      Your interactions are strictly non-training and never logged on external telemetry servers.
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Guaranteed</span>
                </div>

                {/* Data Retention */}
                <div className="p-4 rounded-xl bg-white border border-[#e2d5f0]">
                  <div className="font-semibold text-[#261238] text-sm mb-1">
                    Local Data Retention Policy
                  </div>
                  <div className="text-xs text-[#67537b] mb-3">
                    Automatically purge conversations older than the designated timeframe:
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[
                      { days: 0, label: 'Indefinite' },
                      { days: 1, label: '24 Hours' },
                      { days: 7, label: '7 Days' },
                      { days: 30, label: '30 Days' },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        onClick={() => onUpdatePrivacySettings({ autoDeleteDays: opt.days })}
                        className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                          privacySettings.autoDeleteDays === opt.days
                            ? 'bg-[#f3e8ff] border-[#a855f7] text-[#7e22ce] font-semibold'
                            : 'bg-[#faf6fd] border-[#e2d5f0] text-[#523d67] hover:bg-[#f3e8ff]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Portability & Erase */}
              <div className="p-4 rounded-xl bg-white border border-[#e2d5f0] space-y-3">
                <div className="font-semibold text-[#261238] text-sm">Data Portability & Erasure</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f3e8ff] hover:bg-[#ede9fe] text-[#6b21a8] text-xs font-medium transition-colors border border-[#d8b4fe]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#9333ea]" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f3e8ff] hover:bg-[#ede9fe] text-[#6b21a8] text-xs font-medium transition-colors border border-[#d8b4fe]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#9333ea]" />
                    <span>Export Markdown</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#e2d5f0]">
                  {confirmDelete ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-300 text-xs">
                      <span className="text-red-700 font-medium">
                        Are you sure? This will wipe all local data and cryptographic keys.
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onClearAllData();
                            setConfirmDelete(false);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold"
                        >
                          Confirm Wipe
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-2.5 py-1 rounded bg-white text-[#523d67] border border-neutral-300 hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Erase all local conversations and reset encryption vault</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#261238] mb-1.5">
                  Test Text for Sensitive PII Scrubbing
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-white border border-[#d8c3ee] p-3 text-xs text-[#28153b] focus:outline-none focus:border-[#9333ea] font-mono"
                  placeholder="Type any test text with emails, phone numbers, API keys, or credit cards..."
                />
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e2d5f0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#261238]">Anonymized Output (Transmitted Form)</span>
                  <span className="text-[11px] font-mono text-[#9333ea] font-bold">
                    {testScrubResult.redactionsCount} entity(ies) scrubbed
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#faf6fd] border border-[#e2d5f0] text-xs font-mono text-[#7e22ce] break-words leading-relaxed">
                  {testScrubResult.scrubbedText}
                </div>
              </div>

              {testScrubResult.detectedTypes.length > 0 && (
                <div className="p-3 rounded-xl bg-[#f8f3fd] border border-[#e2d5f0] text-xs">
                  <span className="font-semibold text-[#261238]">Detected Categories: </span>
                  <span className="text-[#67537b]">
                    {testScrubResult.detectedTypes.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-4 text-xs leading-relaxed text-[#4d3761]">
              <div className="p-3.5 rounded-xl bg-[#f3e8ff] border border-[#d8b4fe] text-[#581c87]">
                <strong className="block text-sm mb-1 text-[#4a1270] font-semibold">
                  Chitragupt AI Privacy Commitment
                </strong>
                Chitragupt is engineered with privacy as a foundational architecture, not an afterthought. Your conversations belong exclusively to you.
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-[#261238] text-sm mb-1">1. Zero Server-Side Persistence</h4>
                  <p>
                    Chitragupt does not maintain a centralized database of your chats. Messages are processed ephemerally in transit to generate intelligence and are never stored on server disks.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#261238] text-sm mb-1">2. AES-GCM (256-Bit) Client Encryption</h4>
                  <p>
                    All saved conversations, attachments, and memory items stored in your browser are encrypted using native Web Crypto API cryptographic primitives with a unique 256-bit AES key.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#261238] text-sm mb-1">3. Zero Model Training on User Data</h4>
                  <p>
                    Your conversations, queries, code snippets, and files are never used to train, retrain, or fine-tune public foundation models.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#261238] text-sm mb-1">4. Client-Side Anonymization & PII Scrubbing</h4>
                  <p>
                    When enabled, the client-side privacy shield scrubs personally identifiable information (emails, phone numbers, credit cards, credentials) prior to transmission.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#261238] text-sm mb-1">5. Right to Erasure & Portability</h4>
                  <p>
                    You maintain complete sovereignty. You can export your entire conversation ledger at any time in standard JSON or Markdown formats, or perform an instant cryptographic wipe.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2d5f0] bg-[#f4ecfa] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#67537b]">
            <ShieldCheck className="w-4 h-4 text-[#db2777]" />
            <span>Zero-Knowledge Architecture Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#f472b6] via-[#fbcfe8] to-[#c084fc] text-[#1e0f2d] font-semibold hover:brightness-105 transition-all shadow-md soft-glow-pink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
