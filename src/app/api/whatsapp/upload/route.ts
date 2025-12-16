import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Tipos de arquivo permitidos e seus mapeamentos
const ALLOWED_TYPES: Record<string, { resourceType: "image" | "video" | "raw", messageType: string }> = {
  // Imagens
  "image/jpeg": { resourceType: "image", messageType: "image" },
  "image/png": { resourceType: "image", messageType: "image" },
  "image/webp": { resourceType: "image", messageType: "image" },
  "image/gif": { resourceType: "image", messageType: "image" },
  // Videos
  "video/mp4": { resourceType: "video", messageType: "video" },
  "video/quicktime": { resourceType: "video", messageType: "video" },
  "video/webm": { resourceType: "video", messageType: "video" },
  // Documentos
  "application/pdf": { resourceType: "raw", messageType: "document" },
  "application/msword": { resourceType: "raw", messageType: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { resourceType: "raw", messageType: "document" },
  "application/vnd.ms-excel": { resourceType: "raw", messageType: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { resourceType: "raw", messageType: "document" },
  // Audio
  "audio/mpeg": { resourceType: "video", messageType: "audio" }, // Cloudinary trata audio como video
  "audio/mp3": { resourceType: "video", messageType: "audio" },
  "audio/ogg": { resourceType: "video", messageType: "audio" },
  "audio/wav": { resourceType: "video", messageType: "audio" },
  "audio/webm": { resourceType: "video", messageType: "audio" },
}

// Limites de tamanho por tipo (em bytes)
const SIZE_LIMITS: Record<string, number> = {
  image: 16 * 1024 * 1024,     // 16MB para imagens
  video: 64 * 1024 * 1024,     // 64MB para videos
  document: 100 * 1024 * 1024, // 100MB para documentos
  audio: 16 * 1024 * 1024,     // 16MB para audio
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    // Verificar se Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary nao configurado" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo
    const fileConfig = ALLOWED_TYPES[file.type]
    if (!fileConfig) {
      const allowedExtensions = Object.keys(ALLOWED_TYPES).map(t => t.split("/")[1]).join(", ")
      return NextResponse.json(
        { error: `Tipo de arquivo nao permitido. Tipos aceitos: ${allowedExtensions}` },
        { status: 400 }
      )
    }

    // Validar tamanho
    const maxSize = SIZE_LIMITS[fileConfig.messageType]
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json(
        { error: `Arquivo muito grande. Maximo para ${fileConfig.messageType}: ${maxMB}MB` },
        { status: 400 }
      )
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar transformacoes baseado no tipo
    let transformation: Record<string, unknown>[] | undefined
    if (fileConfig.messageType === "image") {
      transformation = [
        { width: 1920, height: 1920, crop: "limit" },
        { quality: "auto:good" },
      ]
    }

    // Upload para Cloudinary
    const result = await new Promise<{
      secure_url: string
      public_id: string
      format: string
      bytes: number
      duration?: number
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `oduo/${session.user.tenantId}/whatsapp`,
          resource_type: fileConfig.resourceType,
          transformation,
          // Manter nome original para documentos
          use_filename: fileConfig.messageType === "document",
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error("[Upload] Cloudinary error:", error)
            reject(error)
          } else if (result) {
            resolve(result)
          } else {
            reject(new Error("Upload falhou"))
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      type: fileConfig.messageType,
      fileName: file.name,
      mimeType: file.type,
      size: result.bytes,
      duration: result.duration,
    })
  } catch (error) {
    console.error("Erro no upload WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    )
  }
}
