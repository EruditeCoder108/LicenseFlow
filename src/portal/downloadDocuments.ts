import type { JourneyEvent } from '../domain/journey'

export type DocumentLanguage = 'en' | 'hi'

export type LicenceEligibility = {
  paymentConfirmed: boolean
  tutorialCompleted: boolean
  examCompleted: boolean
  knowledgePassed: boolean
}

export type DemonstrationLicenceData = {
  applicationId: string
  holderName: string
  dateOfBirth?: string
  vehicleClasses: string[]
  completedAt: string
  paymentReference?: string
}

export type JourneyReceiptData = DemonstrationLicenceData & {
  correctAnswers: number
  totalQuestions: number
  interruptionRecovered: boolean
  integrityStatus: string
  events: JourneyEvent[]
}

const encoder = new TextEncoder()

export function isDemonstrationLicenceEligible(value: LicenceEligibility): boolean {
  return value.paymentConfirmed && value.tutorialCompleted && value.examCompleted && value.knowledgePassed
}

function stableNumber(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return String(hash >>> 0).padStart(10, '0').slice(-10)
}

export function demonstrationLicenceNumber(applicationId: string): string {
  return `MP-DLL-${stableNumber(applicationId)}`
}

export function verificationCode(applicationId: string): string {
  return `DEMO-${stableNumber(`verify:${applicationId}`).slice(0, 8)}`
}

function concatenate(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function ascii(value: string): Uint8Array {
  return encoder.encode(value)
}

export function createSingleImagePdf(
  jpeg: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  pageWidth = 800,
  pageHeight = Math.round(pageWidth * imageHeight / imageWidth),
): Uint8Array {
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`
  const objects: Uint8Array[] = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Count 1 /Kids [3 0 R] >>'),
    ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
    concatenate([
      ascii(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      ascii('\nendstream'),
    ]),
    ascii(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`),
  ]

  const header = ascii('%PDF-1.4\n% LicenceFlow demonstration export\n')
  const chunks: Uint8Array[] = [header]
  const offsets = [0]
  let length = header.length
  objects.forEach((object, index) => {
    offsets.push(length)
    const chunk = concatenate([ascii(`${index + 1} 0 obj\n`), object, ascii('\nendobj\n')])
    chunks.push(chunk)
    length += chunk.length
  })

  const xrefOffset = length
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n')
  chunks.push(ascii(xref))
  return concatenate(chunks)
}

function formatDate(value: string, language: DocumentLanguage): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function addMonths(value: string, months: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'MP'
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current)
      current = word
    } else current = candidate
  }
  if (current) lines.push(current)
  return lines
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3): number {
  const lines = wrapLines(context, text, maxWidth).slice(0, maxLines)
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Document rendering is unavailable in this browser.')
  return { canvas, context }
}

function drawField(context: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number): void {
  context.fillStyle = '#58708f'
  context.font = '600 22px Arial, sans-serif'
  context.fillText(label.toUpperCase(), x, y)
  context.fillStyle = '#071c38'
  context.font = '700 31px Arial, sans-serif'
  drawWrappedText(context, value, x, y + 42, width, 37, 2)
}

function drawLicence(data: DemonstrationLicenceData, language: DocumentLanguage): HTMLCanvasElement {
  const { canvas, context } = createCanvas(1600, 1000)
  context.fillStyle = '#f6f2e8'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#0d2854'
  context.fillRect(0, 0, canvas.width, 210)
  context.fillStyle = '#f3a712'
  context.fillRect(0, 210, canvas.width, 12)

  context.fillStyle = '#ffffff'
  context.font = '700 28px "Nirmala UI", Arial, sans-serif'
  context.fillText(language === 'hi' ? 'मध्य प्रदेश परिवहन - प्रदर्शन' : 'MADHYA PRADESH TRANSPORT - DEMONSTRATION', 72, 76)
  context.font = '800 54px "Nirmala UI", Arial, sans-serif'
  context.fillText(language === 'hi' ? 'लर्नर लाइसेंस - प्रोटोटाइप' : "LEARNER'S LICENCE - PROTOTYPE", 72, 150)
  context.textAlign = 'right'
  context.font = '700 25px Arial, sans-serif'
  context.fillText('NOT A GOVERNMENT RECORD', 1525, 82)
  context.fillText('NOT VALID FOR DRIVING', 1525, 125)
  context.textAlign = 'left'

  context.save()
  context.translate(930, 610)
  context.rotate(-0.22)
  context.globalAlpha = 0.07
  context.fillStyle = '#b42318'
  context.font = '900 152px Arial, sans-serif'
  context.textAlign = 'center'
  context.fillText('NOT VALID', 0, 0)
  context.restore()

  context.fillStyle = '#e7edf5'
  context.fillRect(72, 282, 280, 350)
  context.beginPath()
  context.arc(212, 412, 74, 0, Math.PI * 2)
  context.fillStyle = '#9fb1c7'
  context.fill()
  context.fillStyle = '#0d2854'
  context.font = '800 54px Arial, sans-serif'
  context.textAlign = 'center'
  context.fillText(initials(data.holderName), 212, 431)
  context.textAlign = 'left'
  context.fillStyle = '#415a77'
  context.font = '600 22px Arial, sans-serif'
  context.fillText('FICTIONAL APPLICANT IMAGE', 90, 595)

  drawField(context, language === 'hi' ? 'धारक' : 'Holder', data.holderName, 410, 305, 500)
  drawField(context, language === 'hi' ? 'डेमो एलएल नंबर' : 'Demo LL number', demonstrationLicenceNumber(data.applicationId), 410, 440, 500)
  drawField(context, language === 'hi' ? 'आवेदन' : 'Application', data.applicationId, 410, 575, 500)
  drawField(context, language === 'hi' ? 'वाहन वर्ग' : 'Vehicle classes', data.vehicleClasses.join(', ') || 'Not recorded', 1010, 305, 500)
  drawField(context, language === 'hi' ? 'पूरा हुआ' : 'Completed', formatDate(data.completedAt, language), 1010, 440, 500)
  drawField(context, language === 'hi' ? 'डेमो अवधि समाप्त' : 'Demo period ends', formatDate(addMonths(data.completedAt, 6), language), 1010, 575, 500)

  context.strokeStyle = '#c7d2df'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(72, 700)
  context.lineTo(1528, 700)
  context.stroke()
  context.fillStyle = '#0d2854'
  context.font = '700 25px Arial, sans-serif'
  context.fillText(`Verification code: ${verificationCode(data.applicationId)}`, 72, 758)
  context.font = '500 23px Arial, sans-serif'
  context.fillStyle = '#334e6f'
  context.fillText(`Sandbox payment reference: ${data.paymentReference ?? 'Not recorded'}`, 72, 804)
  context.fillStyle = '#8f1d14'
  context.font = '800 27px Arial, sans-serif'
  context.fillText('DEMONSTRATION DOCUMENT - NO GOVERNMENT RECORD CREATED', 72, 875)
  context.fillStyle = '#415a77'
  context.font = '500 21px Arial, sans-serif'
  drawWrappedText(context, 'Generated locally by the LicenceFlow hackathon prototype. This file cannot establish identity, authorize driving, or replace an official Madhya Pradesh Learner\'s Licence.', 72, 920, 1450, 30, 2)
  return canvas
}

function drawReceipt(data: JourneyReceiptData, language: DocumentLanguage): HTMLCanvasElement {
  const height = Math.max(1754, 510 + data.events.length * 96)
  const { canvas, context } = createCanvas(1240, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#0d2854'
  context.fillRect(0, 0, canvas.width, 230)
  context.fillStyle = '#ffffff'
  context.font = '800 48px "Nirmala UI", Arial, sans-serif'
  context.fillText(language === 'hi' ? 'LicenceFlow यात्रा रसीद' : 'LicenceFlow Journey Receipt', 68, 98)
  context.font = '500 24px Arial, sans-serif'
  context.fillText('SYNTHETIC HACKATHON RECORD - NOT A GOVERNMENT RECEIPT', 68, 157)

  context.fillStyle = '#f3f6fa'
  context.fillRect(55, 275, 1130, 190)
  drawField(context, 'Application', data.applicationId, 84, 325, 320)
  drawField(context, 'Knowledge result', `${data.correctAnswers}/${data.totalQuestions} - Passed`, 450, 325, 300)
  drawField(context, 'Technical recovery', data.interruptionRecovered ? 'Recovered safely' : 'No interruption', 820, 325, 300)

  context.fillStyle = '#0d2854'
  context.font = '800 34px Arial, sans-serif'
  context.fillText(language === 'hi' ? 'क्रमवार घटनाएँ' : 'Events in order', 68, 535)
  let y = 595
  for (const event of data.events) {
    context.fillStyle = '#0b6bcb'
    context.beginPath()
    context.arc(82, y - 8, 11, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#071c38'
    context.font = '700 25px "Nirmala UI", Arial, sans-serif'
    const titleEnd = drawWrappedText(context, event.title, 115, y, 980, 30, 2)
    context.fillStyle = '#415a77'
    context.font = '500 20px "Nirmala UI", Arial, sans-serif'
    drawWrappedText(context, event.detail, 115, titleEnd + 4, 980, 25, 2)
    context.fillStyle = '#64748b'
    context.font = '500 17px Arial, sans-serif'
    context.fillText(`${formatDate(event.at, language)} - ${event.synthetic ? 'Synthetic/prototype event' : 'Browser event'}`, 115, titleEnd + 61)
    y += 96
  }

  context.fillStyle = '#8f1d14'
  context.font = '800 23px Arial, sans-serif'
  context.fillText('This receipt records a prototype journey only. It is not proof of application, payment, test result or licence issuance.', 68, canvas.height - 72)
  return canvas
}

function canvasJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('The document image could not be created.'))
      resolve(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/jpeg', 0.92)
  })
}

async function canvasPdf(canvas: HTMLCanvasElement, pageWidth: number): Promise<Blob> {
  const jpeg = await canvasJpeg(canvas)
  return new Blob([createSingleImagePdf(jpeg, canvas.width, canvas.height, pageWidth)], { type: 'application/pdf' })
}

export async function createDemonstrationLicencePdf(data: DemonstrationLicenceData, language: DocumentLanguage): Promise<Blob> {
  return canvasPdf(drawLicence(data, language), 800)
}

export async function createJourneyReceiptPdf(data: JourneyReceiptData, language: DocumentLanguage): Promise<Blob> {
  return canvasPdf(drawReceipt(data, language), 595)
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}
