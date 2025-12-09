"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  processTemplate,
  getExampleData,
} from "@/lib/template-variables"
import { TiptapEditor } from "./tiptap-editor"
import { Eye, EyeOff, RotateCcw } from "lucide-react"

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  onReset: () => void
  isCustom: boolean
  type: "contract" | "receipt"
}

export function TemplateEditor({
  value,
  onChange,
  onReset,
  isCustom,
  type,
}: TemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const previewHtml = processTemplate(value, getExampleData())

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {type === "contract" ? "Template do Contrato" : "Template do Recibo"}
                {isCustom ? (
                  <Badge variant="secondary" className="text-xs">
                    Customizado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Use o botão "Variáveis" na barra de ferramentas para inserir dados dinâmicos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Editor
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </>
                )}
              </Button>
              {isCustom && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurar Padrão
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {showPreview ? (
            <div className="border rounded-md bg-white">
              <div className="p-2 border-b bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  Preview com dados de exemplo
                </span>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[550px] border-0"
                title="Preview do template"
              />
            </div>
          ) : (
            <TiptapEditor
              content={value}
              onChange={onChange}
              placeholder={
                type === "contract"
                  ? "Comece a escrever seu contrato de locação..."
                  : "Comece a escrever seu recibo de pagamento..."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
