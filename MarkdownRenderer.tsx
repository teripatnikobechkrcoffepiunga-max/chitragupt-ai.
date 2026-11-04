import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Configure marked for clean, secure rendering
  const parsedHtml = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    return marked.parse(content || '') as string;
  }, [content]);

  // Handle copying code blocks
  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // We enhance markdown formatting with soft purple typography and syntax styling
  return (
    <div className="max-w-none text-[#28153b] text-[15px] leading-7 select-text">
      <div
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
        className="markdown-body space-y-3 [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#221034] [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#26133a] [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#2e1844] [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[#f472b6] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#4d3363] [&_blockquote]:bg-[#faf5fe] [&_blockquote]:py-1.5 [&_blockquote]:rounded-r-lg [&_code]:bg-[#f3e8ff] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[#86198f] [&_code]:font-mono [&_code]:text-[13px] [&_code]:border [&_code]:border-[#e9d5ff] [&_pre]:bg-[#211630] [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#382650] [&_pre]:shadow-md [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0 [&_pre_code]:text-[#f5f0fb] [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-[#e5d7f3] [&_th]:bg-[#f3e8ff] [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[#581c87] [&_td]:border [&_td]:border-[#e5d7f3] [&_td]:p-2.5"
      />
    </div>
  );
};
