"use client";

import { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent, useState } from "react";
import { Send, X } from "lucide-react";
import type { ImageAttachment } from "@/lib/contexts/chat-context";

interface PastedImage {
  attachment: ImageAttachment;
  previewUrl: string;
}

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>, attachments?: ImageAttachment[]) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target?.result as string;
          setPastedImages((prev) => [
            ...prev,
            {
              attachment: { name: file.name || "image.png", contentType: file.type, url: dataUrl },
              previewUrl: dataUrl,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(e, pastedImages.length > 0 ? pastedImages.map((img) => img.attachment) : undefined);
    setPastedImages([]);
  };

  return (
    <form onSubmit={onFormSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        {pastedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pastedImages.map((img, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={img.previewUrl}
                  alt="Pasted image"
                  className="h-16 w-16 object-cover rounded-lg border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-neutral-700 text-white rounded-full p-0.5 hover:bg-neutral-900 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && pastedImages.length === 0)}
          className="absolute right-3 bottom-3 p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
        >
          <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || (!input.trim() && pastedImages.length === 0) ? 'text-neutral-300' : 'text-blue-600'}`} />
        </button>
      </div>
    </form>
  );
}
