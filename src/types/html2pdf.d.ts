declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number]
    filename?: string
    image?: { type: string; quality: number }
    html2canvas?: {
      scale?: number
      useCORS?: boolean
      logging?: boolean
      letterRendering?: boolean
      allowTaint?: boolean
    }
    jsPDF?: {
      unit?: string
      format?: string | number[]
      orientation?: string
      compress?: boolean
    }
    pagebreak?: { mode?: string[]; before?: string[]; after?: string[]; avoid?: string[] }
    enableLinks?: boolean
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker
    from(element: HTMLElement | string): Html2PdfWorker
    save(): Promise<void>
    outputPdf(type?: string): Promise<Blob | string | ArrayBuffer>
    output(type: string, options?: object): Promise<Blob | string | ArrayBuffer>
    then<T>(callback: (worker: Html2PdfWorker) => T): Promise<T>
    toPdf(): Html2PdfWorker
    get(type: string, options?: object): Promise<unknown>
  }

  function html2pdf(): Html2PdfWorker
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfWorker

  export default html2pdf
}
