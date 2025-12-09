import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import { TEMPLATE_VARIABLES } from "@/lib/template-variables"

// Componente React para renderizar o chip de variável
function VariableChipComponent({ node }: NodeViewProps) {
  const variableKey = node.attrs.variableKey as string
  const variable = TEMPLATE_VARIABLES.find((v) => v.key === variableKey)

  // Cores por categoria
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    cliente: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    reserva: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    equipamento: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
    empresa: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
    outros: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  }

  const colors = categoryColors[variable?.category || "outros"]

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} cursor-default select-none`}
        contentEditable={false}
        data-variable={variableKey}
      >
        <span className="opacity-60">{`{`}</span>
        {variable?.label || variableKey}
        <span className="opacity-60">{`}`}</span>
      </span>
    </NodeViewWrapper>
  )
}

// Extensão Tiptap para variáveis
export const VariableExtension = Node.create({
  name: "variable",

  group: "inline",

  inline: true,

  atom: true, // Não pode ser editado internamente

  addAttributes() {
    return {
      variableKey: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable"),
        renderHTML: (attributes) => {
          return {
            "data-variable": attributes.variableKey,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // No HTML final, renderiza como {variavel} em texto simples
    return ["span", mergeAttributes(HTMLAttributes), `{${HTMLAttributes["data-variable"]}}`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChipComponent)
  },

  addCommands() {
    return {
      insertVariable:
        (variableKey: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variableKey },
          })
        },
    }
  },
})

// Função para converter texto com {variavel} para nodes do Tiptap
export function htmlToTiptapContent(html: string): string {
  // Substitui {variavel} por spans com data-variable
  return html.replace(
    /\{([a-zA-Z]+)\}/g,
    '<span data-variable="$1">{$1}</span>'
  )
}

// Função para converter HTML do Tiptap de volta para {variavel}
export function tiptapContentToHtml(html: string): string {
  // Remove os spans e mantém apenas {variavel}
  return html.replace(
    /<span[^>]*data-variable="([^"]+)"[^>]*>[^<]*<\/span>/g,
    "{$1}"
  )
}

// Declaração de tipos para o comando customizado
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    variable: {
      insertVariable: (variableKey: string) => ReturnType
    }
  }
}
