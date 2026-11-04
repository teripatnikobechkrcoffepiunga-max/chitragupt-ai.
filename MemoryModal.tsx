import React, { useState } from 'react';
import {
  X,
  Brain,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Tag,
  SlidersHorizontal,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (
    content: string,
    category?: MemoryItem['category'],
    importance?: number,
    tags?: string[]
  ) => void;
  onUpdateMemory: (
    id: string,
    newContent: string,
    importance?: number,
    tags?: string[]
  ) => void;
  onToggleMemory: (id: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onToggleMemory,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'guide'>('memories');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newImportance, setNewImportance] = useState<number>(4);
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [newTagsInput, setNewTagsInput] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportance, setEditImportance] = useState<number>(3);
  const [editTagsInput, setEditTagsInput] = useState('');

  // Filtering & Sorting
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'importance' | 'recent'>('importance');

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(memories.flatMap((m) => m.tags || []))
  );

  const handleAdd = () => {
    if (!newMemoryText.trim()) return;
    const tags = newTagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onAddMemory(newMemoryText.trim(), newCategory, newImportance, tags);
    setNewMemoryText('');
    setNewTagsInput('');
    setNewImportance(4);
  };

  const startEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditImportance(m.importance || 3);
    setEditTagsInput((m.tags || []).join(', '));
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      const tags = editTagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      onUpdateMemory(id, editContent.trim(), editImportance, tags);
    }
    setEditingId(null);
  };

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    if (selectedTagFilter === 'all') return true;
    return (m.tags || []).includes(selectedTagFilter);
  });

  // Sort memories
  const sortedMemories = [...filteredMemories].sort((a, b) => {
    if (sortBy === 'importance') {
      const diff = (b.importance || 3) - (a.importance || 3);
      if (diff !== 0) return diff;
      return b.updatedAt - a.updatedAt;
    }
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#faf6fd] border border-[#d8c3ee] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-[#28153b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2d5f0] bg-[#f4ecfa]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#f472b6] via-[#fbcfe8] to-[#c084fc] text-[#1e0f2d] shadow-sm soft-glow-pink">
              <Brain className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#261238]">Custom Memory Ledger</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8] soft-glow-pink">
                  Private & Ranked
                </span>
              </div>
              <p className="text-xs text-[#67537b]">
                Only custom memories you enter or approve are visible. Zero public leakage.
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

        {/* Tab Controls */}
        <div className="flex border-b border-[#e2d5f0] bg-[#f8f2fc] px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('memories')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'memories'
                ? 'border-[#9333ea] text-[#7e22ce] font-semibold'
                : 'border-transparent text-[#746087] hover:text-[#261238]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Memories ({memories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-[#9333ea] text-[#7e22ce] font-semibold'
                : 'border-transparent text-[#746087] hover:text-[#261238]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ranking & Priority Guide</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-[#28153b]">
          {activeTab === 'memories' && (
            <>
              {/* Add New Custom Memory Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2d5f0] shadow-2xs space-y-3">
                <div className="text-xs font-semibold text-[#261238] flex items-center justify-between">
                  <span>Add New Custom Memory</span>
                  <span className="text-[11px] text-[#9333ea] font-medium">Ranked 1 to 5 Stars</span>
                </div>

                <textarea
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g. 'I develop in TypeScript and Tailwind. Always format code with clean type safety.'"
                  rows={2}
                  className="w-full bg-[#faf6fe] border border-[#d8c3ee] rounded-xl p-3 text-xs text-[#28153b] placeholder-[#8c74a5] focus:outline-none focus:border-[#9333ea]"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {/* Importance Stars Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#67537b]">Importance:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewImportance(star)}
                          className="p-1 hover:scale-110 transition-transform"
                          title={`Priority ${star}/5`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newImportance
                                ? 'fill-[#ec4899] text-[#ec4899]'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-[#faf6fe] border border-[#d8c3ee] rounded-lg px-2.5 py-1 text-xs text-[#28153b] focus:outline-none"
                  >
                    <option value="preference">Preference</option>
                    <option value="fact">Fact</option>
                    <option value="work">Work & Code</option>
                    <option value="project">Project</option>
                    <option value="instruction">Instruction</option>
                  </select>

                  {/* Tags Input */}
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={newTagsInput}
                      onChange={(e) => setNewTagsInput(e.target.value)}
                      placeholder="Tags: coding, privacy, style..."
                      className="w-full bg-[#faf6fe] border border-[#d8c3ee] rounded-lg px-2.5 py-1 text-xs text-[#28153b] placeholder-[#8c74a5] focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAdd}
                    disabled={!newMemoryText.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#f472b6] via-[#fbcfe8] to-[#c084fc] text-[#1e0f2d] font-semibold text-xs shadow-md hover:brightness-105 disabled:opacity-40 transition-all soft-glow-pink"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Memory</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters & Sort Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#67537b]">
                {/* Tag Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <Tag className="w-3.5 h-3.5 text-[#9333ea] flex-shrink-0" />
                  <button
                    onClick={() => setSelectedTagFilter('all')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                      selectedTagFilter === 'all'
                        ? 'bg-[#9333ea] text-white font-semibold'
                        : 'bg-white border border-[#e2d5f0] text-[#67537b] hover:text-[#261238]'
                    }`}
                  >
                    All ({memories.length})
                  </button>
                  {allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTagFilter(t)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                        selectedTagFilter === t
                          ? 'bg-[#db2777] text-white font-semibold'
                          : 'bg-white border border-[#e2d5f0] text-[#67537b] hover:text-[#261238]'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#9333ea]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-[#d8c3ee] rounded-lg px-2 py-0.5 text-xs text-[#28153b] focus:outline-none"
                  >
                    <option value="importance">Rank: Highest Importance First</option>
                    <option value="recent">Recent: Most Recent First</option>
                  </select>
                </div>
              </div>

              {/* Memory Items List */}
              <div className="space-y-2.5">
                {sortedMemories.map((m) => {
                  const isEditing = m.id === editingId;

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        m.enabled
                          ? 'bg-white border-[#e2d5f0] shadow-2xs'
                          : 'bg-[#faf6fe] border-[#e2d5f0] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox toggle */}
                        <button
                          onClick={() => onToggleMemory(m.id)}
                          className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            m.enabled
                              ? 'bg-[#9333ea] border-[#9333ea] text-white'
                              : 'border-neutral-300 bg-transparent'
                          }`}
                          title={m.enabled ? 'Enabled' : 'Disabled'}
                        >
                          {m.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        {/* Content or Edit Input */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
                                className="w-full bg-[#faf6fe] border border-[#9333ea] rounded-xl p-2 text-xs text-[#28153b] focus:outline-none"
                              />
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-[#67537b]">Stars:</span>
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setEditImportance(s)}
                                    >
                                      <Star
                                        className={`w-3.5 h-3.5 ${
                                          s <= editImportance
                                            ? 'fill-[#ec4899] text-[#ec4899]'
                                            : 'text-neutral-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={editTagsInput}
                                  onChange={(e) => setEditTagsInput(e.target.value)}
                                  placeholder="Tags: comma separated"
                                  className="bg-[#faf6fe] border border-[#d8c3ee] rounded px-2 py-0.5 text-xs text-[#28153b]"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveEdit(m.id)}
                                    className="px-2 py-0.5 rounded bg-[#9333ea] text-white font-semibold text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-0.5 rounded bg-neutral-200 text-[#523d67] text-xs hover:bg-neutral-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-[#28153b] leading-relaxed">
                                {m.content}
                              </p>

                              {/* Badges: Stars, Category, Tags */}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Importance Stars */}
                                <div
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#faf6fe] border border-[#e2d5f0]"
                                  title={`Importance Score: ${m.importance || 3}/5`}
                                >
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < (m.importance || 3)
                                          ? 'fill-[#ec4899] text-[#ec4899]'
                                          : 'text-neutral-300'
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Category */}
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
                                  {m.category}
                                </span>

                                {/* Tags */}
                                {(m.tags || []).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.2 rounded text-[10px] bg-[#fce7f3] text-[#db2777] font-mono border border-[#fbcfe8]"
                                  >
                                    #{tag}
                                  </span>
                                ))}

                                <span className="text-[10px] text-[#7e6992] ml-auto">
                                  {new Date(m.updatedAt || m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(m)}
                              className="p-1 rounded text-[#746087] hover:text-[#9333ea] hover:bg-[#eee4f8] transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMemory(m.id)}
                              className="p-1 rounded text-[#746087] hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sortedMemories.length === 0 && (
                  <div className="text-center py-8 text-[#746087] text-xs">
                    No custom memories match the current filter. Add one above or converse with Chitragupt!
                  </div>
                )}
              </div>

              {memories.length > 0 && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[#67537b]">
                    {memories.filter((m) => m.enabled).length} active custom memories will be ranked for context.
                  </span>
                  <button
                    onClick={onClearAllMemories}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear all custom memories
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-[#4d3761]">
              <div className="p-4 rounded-2xl bg-white border border-[#e2d5f0] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#7e22ce] text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#db2777]" />
                  <span>Privacy Isolation Principle</span>
                </div>
                <p className="text-[#67537b]">
                  Only your custom memories entered above are ever displayed here. Chitragupt&apos;s universal world-level memory operates silently inside the core intelligence without displaying internal dumps to the public.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e2d5f0] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#db2777] text-sm">
                  <Star className="w-4 h-4 fill-[#ec4899] text-[#ec4899]" />
                  <span>Importance Ranking & Context Optimization</span>
                </div>
                <ul className="space-y-2 list-disc pl-4 text-[#67537b]">
                  <li>
                    <strong className="text-[#28153b]">5 Stars (Critical):</strong> Non-negotiable instructions, primary coding languages, and core project architectural rules. Always injected first.
                  </li>
                  <li>
                    <strong className="text-[#28153b]">3-4 Stars (High/Medium):</strong> Stylistic preferences, favorite frameworks, or domain facts. Injected when relevant to user questions.
                  </li>
                  <li>
                    <strong className="text-[#28153b]">1-2 Stars (Low/Contextual):</strong> Transient details or minor preferences. Automatically de-prioritized if prompt context budget nears limits.
                  </li>
                  <li>
                    <strong className="text-[#28153b]">Tag Matching:</strong> If your prompt mentions terms matching custom memory tags (e.g. &apos;#react&apos;, &apos;#privacy&apos;), those tagged memories receive priority boosting.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2d5f0] bg-[#f4ecfa] flex items-center justify-between text-xs">
          <span className="text-[#67537b]">
            Ranked Memory System Verified
          </span>
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
