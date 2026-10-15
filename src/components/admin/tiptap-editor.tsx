"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  className,
  disabled = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "text-burgundy-700 underline font-medium",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with external value if changed externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="h-64 border border-gray-200 rounded-xs bg-slate-50 flex items-center justify-center text-xs text-gov-muted">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL (must start with https:// or http://):", previousUrl);

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Safety: ensure it starts with http://, https://, mailto:, or tel:
    const trimmed = url.trim();
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("mailto:") &&
      !trimmed.startsWith("tel:")
    ) {
      toast.error("Invalid link protocol. Please enter a valid URL starting with https://, mailto:, or tel:");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  return (
    <div
      className={cn(
        "border border-gray-300 rounded-xs bg-white overflow-hidden focus-within:border-burgundy-700 focus-within:ring-1 focus-within:ring-burgundy-700 transition-colors flex flex-col",
        disabled && "opacity-60 pointer-events-none bg-slate-50",
        className
      )}
    >
      {/* Editor Toolbar */}
      <div className="px-2 py-1.5 border-b border-gray-200 bg-slate-50 flex items-center gap-1 flex-wrap text-gov-charcoal">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("bold") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Bold"
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("italic") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Italic"
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <span className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1",
            editor.isActive("heading", { level: 2 })
              ? "bg-burgundy-100 text-burgundy-900 font-bold"
              : "text-gov-charcoal"
          )}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1",
            editor.isActive("heading", { level: 3 })
              ? "bg-burgundy-100 text-burgundy-900 font-bold"
              : "text-gov-charcoal"
          )}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        <span className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("bulletList") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("orderedList") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("blockquote") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Blockquote"
          aria-label="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        <span className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true" />

        {/* Link / Unlink */}
        <button
          type="button"
          onClick={setLink}
          className={cn(
            "p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors",
            editor.isActive("link") ? "bg-burgundy-100 text-burgundy-900 font-bold" : "text-gov-charcoal"
          )}
          title="Insert Link"
          aria-label="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-xs text-xs font-semibold hover:bg-slate-200 transition-colors text-rose-700"
            title="Remove Link"
            aria-label="Remove Link"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Undo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-xs text-xs text-gray-500 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Undo"
            aria-label="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-xs text-xs text-gray-500 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Redo"
            aria-label="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className="p-4 min-h-[220px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none text-gov-charcoal focus:outline-none leading-relaxed"
      />
    </div>
  );
}
