"use client"

import { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { VariableDropdown } from "./variable-dropdown"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Undo,
  Redo,
  Code,
  Minus,
  Plus,
  Trash2,
} from "lucide-react"

interface EditorToolbarProps {
  editor: Editor | null
  showHtml: boolean
  onToggleHtml: () => void
}

export function EditorToolbar({ editor, showHtml, onToggleHtml }: EditorToolbarProps) {
  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    title,
    children,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled || showHtml}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  )

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "p"

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/30">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <Select
        value={currentHeading}
        onValueChange={(value) => {
          if (value === "p") {
            editor.chain().focus().setParagraph().run()
          } else {
            const level = parseInt(value.replace("h", "")) as 1 | 2 | 3
            editor.chain().focus().toggleHeading({ level }).run()
          }
        }}
        disabled={showHtml}
      >
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">Parágrafo</SelectItem>
          <SelectItem value="h1">Título 1</SelectItem>
          <SelectItem value="h2">Título 2</SelectItem>
          <SelectItem value="h3">Título 3</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Formatação básica */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Sublinhado (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Listas */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alinhamento */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Tabela */}
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Inserir tabela"
      >
        <Table className="h-4 w-4" />
      </ToolbarButton>

      {editor.isActive("table") && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Adicionar coluna"
          >
            <Plus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Remover coluna"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Adicionar linha"
          >
            <Plus className="h-4 w-4 rotate-90" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Remover linha"
          >
            <Minus className="h-4 w-4 rotate-90" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Remover tabela"
          >
            <Trash2 className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Variáveis */}
      <VariableDropdown editor={editor} />

      <div className="flex-1" />

      {/* Toggle HTML */}
      <Button
        type="button"
        variant={showHtml ? "secondary" : "ghost"}
        size="sm"
        onClick={onToggleHtml}
        title="Ver/editar HTML"
        className="h-8 gap-1.5 px-2"
      >
        <Code className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">HTML</span>
      </Button>
    </div>
  )
}
