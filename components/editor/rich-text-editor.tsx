"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  initialContent?: Record<string, unknown>;
  htmlContent?: string;
  onChange: (value: Record<string, unknown>) => void;
};

export function RichTextEditor({ initialContent, htmlContent, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Начните писать материал или используйте Generate with AI…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (htmlContent) {
      editor.commands.setContent(htmlContent, true);
      return;
    }

    if (initialContent) {
      editor.commands.setContent(initialContent, true);
    }
  }, [editor, htmlContent, initialContent]);

  if (!editor) {
    return null;
  }

  const controls = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { icon: Pilcrow, action: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    {
      icon: Link2,
      action: () => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("URL", previous || "https://");

        if (url === null) {
          return;
        }

        if (!url) {
          editor.chain().focus().unsetLink().run();
          return;
        }

        editor.chain().focus().setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
    },
  ];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b bg-secondary/50 p-3">
        {controls.map((control, index) => {
          const Icon = control.icon;
          return (
            <Button
              key={`${Icon.displayName || Icon.name}-${index}`}
              type="button"
              size="icon"
              variant={control.active ? "default" : "outline"}
              className={cn("h-9 w-9 rounded-xl", !control.active && "shadow-none")}
              onClick={control.action}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
