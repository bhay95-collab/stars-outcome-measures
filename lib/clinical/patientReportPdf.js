import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { buildISNCSCISummaryRows, buildPatientSummary, fmtDate, formatResultValue } from './patientSummary'
import {
  followUpAttentionLabel,
  followUpRecordOneLine,
  formatFollowUpDate,
  getFollowUpRecordAttention,
  getFollowUpRecordCompletedAt,
  summarizeFollowUpRecords,
} from '../followups'

const NAVY = rgb(0.09, 0.24, 0.41)
const INK = rgb(0.09, 0.13, 0.22)
const MUTED = rgb(0.35, 0.4, 0.48)
const LINE = rgb(0.84, 0.88, 0.92)
const SOFT = rgb(0.96, 0.98, 1)
const GREEN = rgb(0.18, 0.48, 0.35)
const AMBER = rgb(0.63, 0.36, 0.08)
const RED = rgb(0.7, 0.16, 0.1)

function toneColor(tone) {
  if (tone === 'green') return GREEN
  if (tone === 'amber') return AMBER
  if (tone === 'red') return RED
  return MUTED
}

function patientName(patient) {
  return patient?.initials || 'Patient'
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function safeFileName(value) {
  return String(value || 'Patient').replace(/[\s/\\:*?"<>|]+/g, '_')
}

export async function exportPatientSummaryPdf({ patient, assessments, followups = [] }) {
  const summary = buildPatientSummary(patient, assessments)
  const followUpSummary = summarizeFollowUpRecords(followups)
  const pdfDoc = await PDFDocument.create()
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const serif = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  let logo = null
  try {
    const logoResp = await fetch('/SquareLogo.png')
    if (logoResp.ok) logo = await pdfDoc.embedPng(await logoResp.arrayBuffer())
  } catch {
    logo = null
  }

  const pageSize = [595, 842]
  const margin = 46
  let page
  let y

  const addPage = () => {
    page = pdfDoc.addPage(pageSize)
    y = 792
    page.drawText('RehabMetrics IQ', { x: margin + 32, y: 790, size: 17, font: serif, color: NAVY })
    if (logo) page.drawImage(logo, { x: margin, y: 786, width: 22, height: 22 })
    page.drawText('Clinical Outcome Summary', { x: margin, y: 764, size: 9, font: regular, color: MUTED })
    page.drawLine({ start: { x: margin, y: 748 }, end: { x: 549, y: 748 }, thickness: 1, color: LINE })
    y = 724
  }

  const ensure = (height) => {
    if (y - height < 46) addPage()
  }

  const heading = (text) => {
    ensure(32)
    page.drawText(text, { x: margin, y, size: 14, font: bold, color: INK })
    y -= 22
  }

  const paragraph = (text, options = {}) => {
    const size = options.size ?? 10
    const width = options.width ?? 500
    const lines = wrapText(text, regular, size, width)
    ensure(lines.length * 14 + 4)
    lines.forEach(line => {
      page.drawText(line, { x: options.x ?? margin, y, size, font: regular, color: options.color ?? MUTED })
      y -= 14
    })
    y -= 3
  }

  const labelValue = (label, value, x, width) => {
    page.drawText(label, { x, y, size: 8, font: bold, color: MUTED })
    page.drawText(String(value ?? '-'), { x, y: y - 15, size: 12, font: bold, color: INK, maxWidth: width })
  }

  addPage()

  page.drawText(patientName(patient), { x: margin, y, size: 24, font: bold, color: INK })
  y -= 28
  paragraph(patient?.diagnosis || 'Diagnosis not recorded', { size: 11, color: MUTED })

  ensure(58)
  const statY = y
  labelValue('Latest assessment', fmtDate(summary.totals.latestDate), margin, 120)
  labelValue('Measures recorded', summary.totals.measures, margin + 138, 100)
  labelValue('Domains covered', summary.totals.domains, margin + 250, 100)
  labelValue('Total assessments', summary.totals.assessments, margin + 360, 100)
  y = statY - 48

  heading('Plain-Language Summary')
  paragraph(summary.plainLanguageSummary)

  heading('Clinical Interpretation')
  summary.interpretation.forEach(text => paragraph(text))

  heading('Domain Overview')
  summary.domains.forEach(domain => {
    if (!domain.entries.length) return
    ensure(54)
    page.drawRectangle({ x: margin, y: y - 34, width: 500, height: 42, color: SOFT, borderColor: LINE, borderWidth: 1 })
    page.drawText(domain.label, { x: margin + 12, y: y - 4, size: 11, font: bold, color: INK })
    page.drawText(domain.score == null ? 'Score not available' : `${domain.score}/100 normalised`, { x: margin + 255, y: y - 4, size: 10, font: bold, color: toneColor(domain.tone) })
    page.drawText(`${domain.trend} - ${domain.status}`, { x: margin + 12, y: y - 22, size: 8.5, font: regular, color: MUTED, maxWidth: 455 })
    y -= 52
  })

  heading('Latest Measures')
  if (!summary.entries.length) {
    paragraph('No recorded outcome measures.')
  } else {
    summary.entries.forEach(entry => {
      ensure(34)
      page.drawText(entry.measure.name, { x: margin, y, size: 9.5, font: bold, color: INK, maxWidth: 220 })
      page.drawText(formatResultValue(entry.latest.results?.primaryValue, entry.measure), { x: margin + 232, y, size: 9.5, font: bold, color: INK })
      page.drawText(fmtDate(entry.latest.created_at), { x: margin + 330, y, size: 9, font: regular, color: MUTED })
      page.drawText(entry.interpretation, { x: margin, y: y - 14, size: 8.5, font: regular, color: toneColor(entry.tone), maxWidth: 470 })
      y -= 36
    })
  }

  if (summary.flags.length) {
    heading('Clinical Signals')
    summary.flags.forEach(flag => paragraph(`${flag.title}: ${flag.value} - ${flag.text}`, { color: toneColor(flag.tone) }))
  }

  heading('Patient-Reported Follow-Up')
  if (followUpSummary.latestResponse?.response || followUpSummary.latestResponse?.assessment) {
    const record = followUpSummary.latestResponse
    const attention = getFollowUpRecordAttention(record)
    paragraph(`${followUpAttentionLabel(attention)} - ${followUpRecordOneLine(record)}`, { color: toneColor(attention) })
    paragraph(`Last response: ${formatFollowUpDate(getFollowUpRecordCompletedAt(record))}. Pending links: ${followUpSummary.pendingCount}. Overdue links: ${followUpSummary.overdueCount}.`)
    if (record.assessment?.interpretation) paragraph(`Interpretation: ${record.assessment.interpretation}`)
    if (record.response?.concern_text) paragraph(`Patient concern: ${record.response.concern_text}`)
  } else {
    paragraph(`No patient-reported follow-up responses. Pending links: ${followUpSummary.pendingCount}.`)
  }

  const latestISNCSCI = summary.entries.find(entry => entry.measureId === 'ISNCSCI')
  const isncsciRows = buildISNCSCISummaryRows(latestISNCSCI?.latest?.results)
  if (isncsciRows.length) {
    heading('ISNCSCI Classification Summary')
    isncsciRows.forEach(([label, value], index) => {
      ensure(30)
      const rowHeight = 26
      page.drawRectangle({
        x: margin,
        y: y - 18,
        width: 500,
        height: rowHeight,
        color: index % 2 === 0 ? SOFT : rgb(1, 1, 1),
        borderColor: LINE,
        borderWidth: 0.5,
      })
      page.drawText(label, { x: margin + 10, y: y - 2, size: 8.5, font: bold, color: MUTED, maxWidth: 190 })
      page.drawText(String(value), { x: margin + 222, y: y - 2, size: 9.5, font: regular, color: INK, maxWidth: 260 })
      y -= rowHeight
    })
    y -= 10
  }

  const bytes = await pdfDoc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `RehabMetricsIQ_${safeFileName(patientName(patient))}_${new Date().toISOString().slice(0, 10)}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
