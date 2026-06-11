import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { MEASURES } from './measures'
import { MCID_VALS } from './mcid'

// Brand palette mirroring patientReportPdf.js
const NAVY  = rgb(0.09, 0.24, 0.41)
const INK   = rgb(0.09, 0.13, 0.22)
const MUTED = rgb(0.35, 0.40, 0.48)
const LINE  = rgb(0.84, 0.88, 0.92)
const SOFT  = rgb(0.96, 0.98, 1.00)
const GREEN = rgb(0.18, 0.48, 0.35)
const AMBER = rgb(0.63, 0.36, 0.08)
const RED   = rgb(0.71, 0.27, 0.10)

const CATEGORY_LABEL = {
  performance:   'Performance & mobility',
  independence:  'Independence / ADL',
  questionnaire: 'Patient-reported',
}

// Manually-curated additional clinical context for the card.
// All values are pulled from the literature already encoded in the registry
// and mcid.js — nothing invented. Where a measure has population-specific
// nuance worth surfacing on a reference card, it appears here.
const EXTRA_NOTES = {
  '10MWT':   'MCID 0.06 m/s (stroke) · 0.10 m/s (TBI, general).',
  'TUG':     'MCID 2.0 s general · 3.5 s in PD. Fall risk ≥13.5 s.',
  '6MWT':    'MDC ≈54 m (pulmonary/MS). Record HR + RPE.',
  'BBS':     'Fall risk <36. MDC ≈5 pts in stroke and PD.',
  'FAC':     'Categorical 0–5. ≥4 = independent on level surface.',
  'ABC':     '<67% low function · <80% fall risk in amputees.',
  'FSS':     'Mean ≥36 = significant fatigue · >45 = severe.',
  'HADS':    'MCID 1.5 pts per subscale (A / D scored separately).',
  'PDQ-8':   'Reported as Summary Index 0–100. Lower is better.',
  'SARA':    'Lower is better. Mild ≤10 · moderate ≤20 · severe >20.',
  'HiMAT':   'High-level mobility. Williams 2009 age-norms (5–12y).',
  'Step':    'Community threshold ≥10 steps in 15 s.',
  'AMP':     'K2 ≈28 · K3 ≈36 · K4 ≥42. VA/DoD recommended.',
  'BIVI':    'Brain Injury Vision Inventory. Lower is better.',
  'ISNCSCI': 'Refer to ASIA International Standards (2019 revision).',
  'NPRS':    'MCID 2 pts or 30% · 1.5 pts in mechanical neck pain.',
  'PSFS':    'Patient-nominated activities. MCID ~2 pts (0.8-4.3 by region).',
  'LEFS':    'MCID = MDC90 = 9 pts. Change: 9 small / 12 moderate / 16 large.',
  'BPFS':    'MDC90 6.5 pts used as change threshold (no established MCID).',
  'KOOS':    'Per-subscale, never totalled. Post-ACLR: Sport 12.1, QOL 18.3.',
  'HOOS':    'Per-subscale. Post-THA MCII far larger (Pain 24, QOL 17).',
  'FAAM':    'CAI deficit: ADL <90%, Sport <80%. Sport MDC95 12.3 > MCID 9.',
  '30STS':   '<12 stands = reduced function in knee OA. Rikli-Jones norms 60-94y.',
  'FTSTS':   '>=12 s assess falls · >15 s recurrent-fall risk (>=65y).',
  'CMS':     'MCID 10.4 post-cuff repair · ~17 subacromial pain.',
  'CAIT':    'Ankle instability: <=24 unstable · <=27 Hiller cut-off. MDC ~3 pts.',
  'ATRS':    'Achilles rupture recovery. Higher = better. MDC ~7-18 pts.',
  'FABQ':    'Yellow flag. PA >15 / Work >34 = high fear-avoidance. Higher = worse.',
}

const HEADER = {
  title:    'Rehab Outcome Measures Quick Reference',
  subtitle: 'MCID, MDC, and clinical cut-offs at a glance',
  brand:    'RehabMetrics IQ · rehabmetricsiq.com',
}

const FOOTER_NOTE =
  'Clinical decision-support reference. Use alongside clinical judgement. ' +
  'Not a diagnostic device. Refer to original publications for definitive values.'

function mcidForRow(measure) {
  if (measure.id === 'HADS') return '1.5 pts (per subscale)'
  if (measure.id === '10MWT') return '0.06 / 0.10 m/s'
  const entry = measure.mcidKey ? MCID_VALS[measure.mcidKey] : null
  if (!entry) return '—'
  return `${entry.thresh} ${entry.unit}`
}

function thresholdSummary(measure) {
  const t = measure.chart?.thresholds
  if (!Array.isArray(t) || t.length === 0) return ''
  // Render cut-off values + labels; pdf-lib's StandardFonts can't display "≤" and "≥",
  // so we use ASCII (<=, >=) here. Replace en-dash with hyphen for the same reason.
  return t
    .map(b => `${b.value} ${b.label}`)
    .join(' · ')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[–—−]/g, '-')
}

function buildRowsByCategory() {
  const groups = { performance: [], independence: [], questionnaire: [] }
  for (const id of Object.keys(MEASURES)) {
    const m = MEASURES[id]
    if (!groups[m.category]) continue
    groups[m.category].push({
      id: m.id,
      name: m.name,
      unit: m.primaryUnit || '—',
      mcid: mcidForRow(m),
      thresholds: thresholdSummary(m),
      note: EXTRA_NOTES[m.id] || '',
    })
  }
  return groups
}

function sanitizeForWinAnsi(text) {
  // StandardFonts (Helvetica family) only support WinAnsi. Convert common
  // Unicode glyphs that appear in the registry to safe ASCII equivalents,
  // then strip anything still outside the printable ASCII / WinAnsi-safe range.
  return String(text ?? '')
    .replace(/[–—−]/g, '-')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[≈]/g, '~')
    .replace(/[→]/g, '->')
    .replace(/[°]/g, ' deg')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[…]/g, '...')
    // Final safety net: strip any remaining non-WinAnsi-safe characters
    // (keep printable ASCII and a small set of common Latin-1 punctuation
    //  including the middle dot at 0xB7).
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
}

function wrapText(text, font, size, maxWidth) {
  const safe = sanitizeForWinAnsi(text)
  const words = safe.split(/\s+/).filter(Boolean)
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

function drawText(page, text, x, y, opts) {
  page.drawText(sanitizeForWinAnsi(text), { x, y, ...opts })
}

function categoryAccent(category) {
  if (category === 'performance')   return NAVY
  if (category === 'independence')  return GREEN
  if (category === 'questionnaire') return AMBER
  return INK
}

/**
 * Build the Outcome Measures Quick Reference PDF.
 * Returns a Uint8Array of the PDF bytes.
 */
export async function buildReferenceCardPdf() {
  const pdfDoc  = await PDFDocument.create()
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // A4 portrait: 595.28 x 841.89 pt
  const PAGE_W = 595.28
  const PAGE_H = 841.89
  const MARGIN_X = 36
  const MARGIN_TOP = 40
  const MARGIN_BOTTOM = 56

  let page = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN_TOP

  // --- Header bar ---
  page.drawRectangle({
    x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: SOFT,
  })
  page.drawRectangle({
    x: 0, y: PAGE_H - 71, width: PAGE_W, height: 1, color: LINE,
  })
  drawText(page, HEADER.title, MARGIN_X, PAGE_H - 36, {
    size: 16, font: bold, color: NAVY,
  })
  drawText(page, HEADER.subtitle, MARGIN_X, PAGE_H - 54, {
    size: 10, font: regular, color: MUTED,
  })
  const brandWidth = bold.widthOfTextAtSize(HEADER.brand, 9)
  drawText(page, HEADER.brand, PAGE_W - MARGIN_X - brandWidth, PAGE_H - 36, {
    size: 9, font: bold, color: NAVY,
  })
  const dateStr = `Generated ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}`
  const dateWidth = regular.widthOfTextAtSize(dateStr, 9)
  drawText(page, dateStr, PAGE_W - MARGIN_X - dateWidth, PAGE_H - 54, {
    size: 9, font: regular, color: MUTED,
  })

  y = PAGE_H - 88

  // --- Body: grouped category rows ---
  const groups = buildRowsByCategory()
  const order = ['performance', 'independence', 'questionnaire']

  const COL = {
    code:    { x: MARGIN_X,      w: 56 },
    name:    { x: MARGIN_X + 60, w: 188 },
    mcid:    { x: MARGIN_X + 252, w: 96 },
    notes:   { x: MARGIN_X + 352, w: PAGE_W - MARGIN_X - (MARGIN_X + 352) },
  }

  function ensureRoom(needed) {
    if (y - needed < MARGIN_BOTTOM + 28) {
      // Footer for previous page
      drawFooter(page)
      page = pdfDoc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN_TOP
    }
  }

  function drawFooter(p) {
    p.drawRectangle({
      x: 0, y: 0, width: PAGE_W, height: 36, color: SOFT,
    })
    p.drawRectangle({
      x: 0, y: 36, width: PAGE_W, height: 1, color: LINE,
    })
    const noteLines = wrapText(FOOTER_NOTE, italic, 8, PAGE_W - MARGIN_X * 2)
    let fy = 22
    for (const ln of noteLines.slice(0, 2)) {
      drawText(p, ln, MARGIN_X, fy, { size: 8, font: italic, color: MUTED })
      fy -= 10
    }
  }

  function drawColumnHeader() {
    page.drawRectangle({
      x: MARGIN_X - 6, y: y - 4, width: PAGE_W - MARGIN_X * 2 + 12, height: 18, color: SOFT,
    })
    drawText(page, 'Measure', COL.code.x, y + 2, { size: 8, font: bold, color: NAVY })
    drawText(page, 'Name & range', COL.name.x, y + 2, { size: 8, font: bold, color: NAVY })
    drawText(page, 'MCID',         COL.mcid.x, y + 2, { size: 8, font: bold, color: NAVY })
    drawText(page, 'Cut-offs & notes', COL.notes.x, y + 2, { size: 8, font: bold, color: NAVY })
    y -= 18
  }

  for (const cat of order) {
    const rows = groups[cat]
    if (!rows || rows.length === 0) continue

    ensureRoom(36)

    // Category heading
    const accent = categoryAccent(cat)
    page.drawRectangle({ x: MARGIN_X - 6, y: y - 2, width: 3, height: 14, color: accent })
    drawText(page, CATEGORY_LABEL[cat], MARGIN_X + 2, y + 1, {
      size: 11, font: bold, color: accent,
    })
    drawText(page, `${rows.length} measures`, PAGE_W - MARGIN_X - regular.widthOfTextAtSize(`${rows.length} measures`, 9), y + 1, {
      size: 9, font: regular, color: MUTED,
    })
    y -= 16

    drawColumnHeader()

    // Rows
    for (const row of rows) {
      const cutOffLines = wrapText(row.thresholds, regular, 8, COL.notes.w)
      const noteLines   = row.note ? wrapText(row.note, italic, 8, COL.notes.w) : []
      const blockLines  = cutOffLines.length + (noteLines.length ? noteLines.length + 0.5 : 0)
      const rowHeight   = Math.max(20, blockLines * 10 + 6)

      ensureRoom(rowHeight)

      // alternating row background
      page.drawRectangle({
        x: MARGIN_X - 6, y: y - rowHeight + 4,
        width: PAGE_W - MARGIN_X * 2 + 12, height: rowHeight,
        color: rgb(1, 1, 1),
      })
      page.drawRectangle({
        x: MARGIN_X - 6, y: y - rowHeight + 4,
        width: PAGE_W - MARGIN_X * 2 + 12, height: 0.5, color: LINE,
      })

      // Measure code
      drawText(page, row.id, COL.code.x, y - 6, { size: 10, font: bold, color: INK })

      // Name + range
      const name = row.name
      drawText(page, name, COL.name.x, y - 6, { size: 9, font: regular, color: INK })
      drawText(page, `Range: ${row.unit}`, COL.name.x, y - 18, { size: 8, font: regular, color: MUTED })

      // MCID
      drawText(page, row.mcid, COL.mcid.x, y - 6, { size: 9, font: bold, color: NAVY })

      // Cut-offs + notes
      let ny = y - 6
      for (const ln of cutOffLines) {
        drawText(page, ln, COL.notes.x, ny, { size: 8, font: regular, color: INK })
        ny -= 10
      }
      if (noteLines.length) {
        ny -= 2
        for (const ln of noteLines) {
          drawText(page, ln, COL.notes.x, ny, { size: 8, font: italic, color: MUTED })
          ny -= 10
        }
      }

      y -= rowHeight
    }

    y -= 6
  }

  // Final footer on last page
  drawFooter(page)

  return pdfDoc.save()
}

export const REFERENCE_CARD_FILENAME = 'rehabmetricsiq-outcome-measures-reference.pdf'
