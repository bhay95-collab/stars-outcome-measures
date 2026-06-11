// Service-level proof-of-value PDF export for Outcomes Intelligence.
// Aggregate data only — no patient identifiers appear in this report.

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { fmtDate } from './patientSummary'

const NAVY = rgb(0.035, 0.294, 0.541)
const INK = rgb(0.11, 0.169, 0.212)
const MUTED = rgb(0.2, 0.294, 0.286)
const LINE = rgb(0.871, 0.875, 0.82)
const SOFT = rgb(0.98, 0.98, 0.953)
const GREEN = rgb(0.165, 0.42, 0.31)
const RED = rgb(0.631, 0.231, 0.188)

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

function rateLabel(rate, met, eligible) {
  if (rate == null) return '-'
  return `${rate}% (${met}/${eligible})`
}

export async function exportServiceOutcomesPdf({ model, serviceName = '' }) {
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
    page.drawText('RehabMetrics IQ', { x: margin + 32, y: 790, size: 17, font: serif, color: NAVY })
    if (logo) page.drawImage(logo, { x: margin, y: 786, width: 22, height: 22 })
    page.drawText('Service Outcomes Report', { x: margin, y: 764, size: 9, font: regular, color: MUTED })
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

  page.drawText(serviceName || 'Caseload Outcomes Overview', { x: margin, y, size: 22, font: bold, color: INK })
  y -= 26
  const periodText = model.totals.firstAssessmentAt
    ? `Outcome measures recorded ${fmtDate(model.totals.firstAssessmentAt)} – ${fmtDate(model.totals.latestAssessmentAt)}. Generated ${fmtDate(model.generatedAt)}.`
    : `Generated ${fmtDate(model.generatedAt)}.`
  paragraph(periodText, { size: 10 })

  ensure(58)
  const statY = y
  labelValue('Patients', model.totals.patientCount, margin, 100)
  labelValue('Assessments', model.totals.assessmentCount, margin + 112, 100)
  labelValue('Improvement rate', model.overall.improvementRate == null ? '-' : `${model.overall.improvementRate}%`, margin + 224, 110)
  labelValue('MCID achievement', model.overall.mcidRate == null ? '-' : `${model.overall.mcidRate}%`, margin + 360, 110)
  y = statY - 48

  heading('Service Highlights')
  model.highlights.forEach(text => paragraph(text))

  heading('Outcomes by Measure')
  if (!model.measureRows.length) {
    paragraph('No outcome measures recorded yet.')
  } else {
    ensure(24)
    page.drawText('Measure', { x: margin, y, size: 8, font: bold, color: MUTED })
    page.drawText('Patients', { x: margin + 218, y, size: 8, font: bold, color: MUTED })
    page.drawText('Repeated', { x: margin + 272, y, size: 8, font: bold, color: MUTED })
    page.drawText('Improved', { x: margin + 330, y, size: 8, font: bold, color: MUTED })
    page.drawText('MCID met', { x: margin + 420, y, size: 8, font: bold, color: MUTED })
    y -= 6
    page.drawLine({ start: { x: margin, y }, end: { x: 549, y }, thickness: 0.8, color: LINE })
    y -= 16

    model.measureRows.forEach(row => {
      ensure(20)
      page.drawText(row.name, { x: margin, y, size: 9, font: bold, color: INK, maxWidth: 210 })
      page.drawText(String(row.patientCount), { x: margin + 218, y, size: 9, font: regular, color: MUTED })
      page.drawText(String(row.pairCount), { x: margin + 272, y, size: 9, font: regular, color: MUTED })
      page.drawText(
        row.improvementRate == null ? '-' : `${row.improvedCount}/${row.pairCount} (${row.improvementRate}%)`,
        { x: margin + 330, y, size: 9, font: regular, color: row.improvementRate == null ? MUTED : GREEN },
      )
      page.drawText(
        row.hasMcid ? rateLabel(row.mcidRate, row.mcidMetCount, row.mcidEligibleCount) : 'No published MCID',
        { x: margin + 420, y, size: 9, font: regular, color: row.mcidRate == null ? MUTED : GREEN },
      )
      y -= 18
    })
  }

  heading('Diagnosis Cohorts')
  if (!model.cohorts.length) {
    paragraph('No patients recorded yet.')
  } else {
    model.cohorts.forEach(cohort => {
      ensure(62)
      page.drawRectangle({ x: margin, y: y - 40, width: 500, height: 50, color: SOFT, borderColor: LINE, borderWidth: 1 })
      page.drawText(cohort.label, { x: margin + 12, y: y - 6, size: 11, font: bold, color: INK, maxWidth: 300 })
      page.drawText(
        `${cohort.patientCount} patient${cohort.patientCount === 1 ? '' : 's'} · ${cohort.assessmentCount} assessments`,
        { x: margin + 320, y: y - 6, size: 9, font: regular, color: MUTED },
      )
      const changeText = cohort.pairCount
        ? `Improvement ${cohort.improvedCount}/${cohort.pairCount} repeated measures (${cohort.improvementRate}%)${cohort.mcidEligibleCount ? ` · MCID met ${cohort.mcidMetCount}/${cohort.mcidEligibleCount} (${cohort.mcidRate}%)` : ''}${cohort.declinedCount ? ` · ${cohort.declinedCount} declined` : ''}`
        : 'No repeat results yet — change reporting unavailable for this cohort.'
      page.drawText(changeText, {
        x: margin + 12, y: y - 24, size: 8.5, font: regular,
        color: cohort.declinedCount ? RED : MUTED, maxWidth: 476,
      })
      y -= 60
    })
  }

  heading('Method and Use')
  paragraph(model.explanation.method)
  if (model.totals.patientReportedCount) {
    paragraph(`${model.totals.patientReportedCount} of the included results were patient-reported follow-up responses; the remainder were recorded in clinic.`)
  }
  paragraph(model.explanation.caution)
  paragraph('This report contains aggregate service data only. No patient identifiers are included.', { size: 8.5 })

  const bytes = await pdfDoc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `RehabMetricsIQ_Service_Outcomes_${new Date(model.generatedAt).toISOString().slice(0, 10)}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
