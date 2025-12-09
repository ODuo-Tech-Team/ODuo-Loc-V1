import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Tipos de arquivos permitidos para documentos
const ALLOWED_TYPES: Record<string, string[]> = {
  // Documentos
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  // Imagens
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary não configurado" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "documents"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG ou WebP" },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      )
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar resource_type baseado no tipo do arquivo
    const isPdf = file.type === "application/pdf"
    const isImage = file.type.startsWith("image/")
    const resourceType = isImage ? "image" : "raw"

    // Upload para Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string; bytes: number; format: string }>((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: `oduo/${session.user.tenantId}/${folder}`,
        resource_type: resourceType,
      }

      // Se for imagem, aplicar otimizações
      if (isImage) {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
        ]
      }

      // Se for PDF, manter original
      if (isPdf) {
        uploadOptions.format = "pdf"
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              bytes: result.bytes,
              format: result.format,
            })
          } else {
            reject(new Error("Upload falhou"))
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      fileSize: result.bytes,
      format: result.format,
      fileName: file.name,
    })
  } catch (error) {
    console.error("Erro no upload de documento:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do documento" },
      { status: 500 }
    )
  }
}
