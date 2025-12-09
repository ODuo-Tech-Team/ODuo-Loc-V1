"use client"

import type html2pdf from "html2pdf.js"

type Html2PdfFunction = typeof html2pdf

// Carrega html2pdf.js dinamicamente (client-side only)
let html2pdfPromise: Promise<Html2PdfFunction> | null = null

async function loadHtml2Pdf(): Promise<Html2PdfFunction> {
  if (typeof window === "undefined") {
    throw new Error("html2pdf só pode ser usado no cliente")
  }

  if (!html2pdfPromise) {
    html2pdfPromise = import("html2pdf.js").then((module) => module.default)
  }

  return html2pdfPromise
}

export interface PDFGeneratorOptions {
  filename?: string
  margin?: number
  format?: "a4" | "letter" | "legal"
  orientation?: "portrait" | "landscape"
}

export async function generatePDFFromHTML(
  html: string,
  options: PDFGeneratorOptions = {}
): Promise<void> {
  const html2pdf = await loadHtml2Pdf()

  const {
    filename = "documento.pdf",
    margin = 10,
    format = "a4",
    orientation = "portrait",
  } = options

  // Cria um container temporário para o HTML
  const container = document.createElement("div")
  container.innerHTML = html
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "0"
  document.body.appendChild(container)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfInstance = html2pdf() as any
    await pdfInstance
      .set({
        margin,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format, orientation },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(container)
      .save()
  } finally {
    // Remove o container temporário
    document.body.removeChild(container)
  }
}

export async function downloadDocumentAsPDF(
  bookingId: string,
  type: "CONTRACT" | "RECEIPT"
): Promise<void> {
  // Busca o HTML do documento
  const response = await fetch(`/api/bookings/${bookingId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Erro ao gerar documento")
  }

  const data = await response.json()
  const filename = type === "CONTRACT" ? "contrato.pdf" : "recibo.pdf"

  await generatePDFFromHTML(data.html, {
    filename,
    format: "a4",
    orientation: "portrait",
    margin: 0,
  })
}
