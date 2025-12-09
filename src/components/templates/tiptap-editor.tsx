"use client"

import { useCallback, useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { EditorToolbar } from "./editor-toolbar"
import { VariableExtension, htmlToTiptapContent, tiptapContentToHtml } from "./variable-extension"
import { Textarea } from "@/components/ui/textarea"

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [showHtml, setShowHtml] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Comece a escrever seu template...",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      VariableExtension,
    ],
    content: htmlToTiptapContent(content),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      if (!showHtml) {
        const html = editor.getHTML()
        const cleanHtml = tiptapContentToHtml(html)
        onChange(cleanHtml)
      }
    },
  })

  // Sincronizar conteúdo quando muda externamente
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = tiptapContentToHtml(editor.getHTML())
      if (currentContent !== content) {
        editor.commands.setContent(htmlToTiptapContent(content))
      }
    }
  }, [content, editor])

  // Atualizar HTML quando alterna para modo HTML
  useEffect(() => {
    if (showHtml && editor) {
      setHtmlContent(tiptapContentToHtml(editor.getHTML()))
    }
  }, [showHtml, editor])

  const handleHtmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newHtml = e.target.value
      setHtmlContent(newHtml)
      onChange(newHtml)
    },
    [onChange]
  )

  const handleToggleHtml = useCallback(() => {
    if (showHtml && editor) {
      // Voltando do modo HTML - aplicar mudanças
      editor.commands.setContent(htmlToTiptapContent(htmlContent))
    }
    setShowHtml(!showHtml)
  }, [showHtml, editor, htmlContent])

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <EditorToolbar
        editor={editor}
        showHtml={showHtml}
        onToggleHtml={handleToggleHtml}
      />

      {showHtml ? (
        <Textarea
          value={htmlContent}
          onChange={handleHtmlChange}
          className="font-mono text-sm min-h-[450px] rounded-none border-0 resize-none focus-visible:ring-0"
          placeholder="HTML do template..."
        />
      ) : (
        <EditorContent editor={editor} className="min-h-[450px]" />
      )}

      <style jsx global>{`
        /* Estilos do editor Tiptap */
        .ProseMirror {
          min-height: 400px;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror:focus {
          outline: none;
        }

        /* Estilos para tabelas */
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }

        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          text-align: left;
          vertical-align: top;
        }

        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .ProseMirror tr:hover td {
          background-color: #f9fafb;
        }

        /* Estilos para headings */
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }

        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }

        .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
        }

        /* Estilos para listas */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        /* Estilos para parágrafos */
        .ProseMirror p {
          margin: 0.5rem 0;
        }

        /* Alinhamento de texto */
        .ProseMirror [style*="text-align: center"] {
          text-align: center;
        }

        .ProseMirror [style*="text-align: right"] {
          text-align: right;
        }

        /* Seleção de tabela */
        .ProseMirror .selectedCell {
          background-color: #dbeafe;
        }

        /* Resize handle para tabelas */
        .ProseMirror .column-resize-handle {
          background-color: #60a5fa;
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
        }

        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }
      `}</style>
    </div>
  )
}
