// ISNCSCI PDF export — overlays scores onto ASIA/ISCOS 2019 worksheet template.
// Uses pdf-lib. Template served from /assets/ASIA-ISCOS-IntlWorksheet_2019.pdf (public/).
// Page is 792×612 landscape; pdf-lib origin is bottom-left.

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const SENS_ROWS = [
  ['C2',506],['C3',493],['C4',480],['C5',467],['C6',454],['C7',441],['C8',428],
  ['T1',414],['T2',401],['T3',389],['T4',375],['T5',362],['T6',349],['T7',336],
  ['T8',323],['T9',310],['T10',297],['T11',284],['T12',271],
  ['L1',258],['L2',245],['L3',232],['L4',219],['L5',206],
  ['S1',193],['S2',180],['S3',167],['S4-5',154],
]

const MOTOR_ROWS = [
  ['C5',467],['C6',454],['C7',441],['C8',428],['T1',414],
  ['L2',245],['L3',232],['L4',219],['L5',206],['S1',193],
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${MONTHS[+m - 1]}/${y}`
}

function safeStr(v) {
  if (v === null || v === undefined || v === '') return ''
  const s = String(v).trim()
  return s === '—' ? '' : s
}

function numVal(v) {
  const n = parseInt(safeStr(v) || '0', 10)
  return isNaN(n) ? 0 : n
}

export async function exportISNCSCIPdf({ patient, inputs, results }) {
  const resp = await fetch('/assets/ASIA-ISCOS-IntlWorksheet_2019.pdf')
  if (!resp.ok) throw new Error('ASIA worksheet template not found')
  const pdfDoc = await PDFDocument.load(await resp.arrayBuffer())
  const page = pdfDoc.getPages()[0]
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const BLACK = rgb(0, 0, 0)

  const put = (txt, x, y, sz = 7) => {
    const s = safeStr(txt)
    if (!s) return
    page.drawText(s, { x, y, size: sz, font, color: BLACK })
  }

  const putC = (txt, x0, y, cw, sz = 7) => {
    const s = safeStr(txt)
    if (!s) return
    const tw = font.widthOfTextAtSize(s, sz)
    page.drawText(s, { x: x0 + Math.max(0, (cw - tw) / 2), y, size: sz, font, color: BLACK })
  }

  const { motorR, motorL, ltR, ltL, ppR, ppL, vac, dap } = inputs
  const meta = results.meta

  // ── Patient header ──────────────────────────────────────────────────────────
  const patientName = [patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.initials || ''
  put(patientName, 438, 589, 9)
  put(fmtDate(new Date().toISOString().slice(0, 10)), 656, 589, 9)

  // ── Sensory grid ────────────────────────────────────────────────────────────
  // R LT x0=227 w=35 · R PP x0=273 w=35 · L LT x0=490 w=35 · L PP x0=536 w=35
  SENS_ROWS.forEach(([lv, cy]) => {
    const y = cy - 2
    putC(safeStr(ltR[lv]), 227, y, 35)
    putC(safeStr(ppR[lv]), 273, y, 35)
    putC(safeStr(ltL[lv]), 490, y, 35)
    putC(safeStr(ppL[lv]), 536, y, 35)
  })

  // ── Motor grid ─────────────────────────────────────────────────────────────
  // R Motor x0=190 w=30 · L Motor x0=579 w=30
  MOTOR_ROWS.forEach(([lv, cy]) => {
    const y = cy - 2
    putC(safeStr(motorR[lv]), 190, y, 30)
    putC(safeStr(motorL[lv]), 579, y, 30)
  })

  // ── Row totals (y=134) ─────────────────────────────────────────────────────
  const MOT_LVS = ['C5','C6','C7','C8','T1','L2','L3','L4','L5','S1']
  const SENS_LVS = SENS_ROWS.map(r => r[0])

  const rMot = MOT_LVS.reduce((s, lv) => s + numVal(motorR[lv]), 0)
  const lMot = MOT_LVS.reduce((s, lv) => s + numVal(motorL[lv]), 0)
  const rLt  = SENS_LVS.reduce((s, lv) => s + numVal(ltR[lv]), 0)
  const rPp  = SENS_LVS.reduce((s, lv) => s + numVal(ppR[lv]), 0)
  const lLt  = SENS_LVS.reduce((s, lv) => s + numVal(ltL[lv]), 0)
  const lPp  = SENS_LVS.reduce((s, lv) => s + numVal(ppL[lv]), 0)

  putC(String(rMot), 190, 134, 30)
  putC(String(rLt),  227, 134, 35)
  putC(String(rPp),  273, 134, 35)
  putC(String(lLt),  490, 134, 35)
  putC(String(lPp),  536, 134, 35)
  putC(String(lMot), 579, 134, 30)

  // ── Subscores strip (y=93, corrected coordinates) ──────────────────────────
  // UER x0=41 w=23 · UEL x0=91 w=23 · UEMS TOTAL x0=155 w=27
  // LER x0=232 w=27 · LEL x0=285 w=27 · LEMS TOTAL x0=348 w=27
  // LTR x0=510 w=25 · LTL x0=556 w=25 · LT TOTAL x0=608 w=28
  // PPR x0=675 w=25 · PPL x0=716 w=25 · PP TOTAL x0=754 w=26
  const y4 = 93
  const uemsR = meta.uems?.r ?? 0
  const uemsL = meta.uems?.l ?? 0
  const lemsR = meta.lems?.r ?? 0
  const lemsL = meta.lems?.l ?? 0

  putC(String(uemsR),         41,  y4, 23, 8)
  putC(String(uemsL),         91,  y4, 23, 8)
  putC(String(uemsR + uemsL), 155, y4, 27, 8)
  putC(String(lemsR),         232, y4, 27, 8)
  putC(String(lemsL),         285, y4, 27, 8)
  putC(String(lemsR + lemsL), 348, y4, 27, 8)
  putC(String(rLt),           510, y4, 25, 8)
  putC(String(lLt),           556, y4, 25, 8)
  putC(String(rLt + lLt),     608, y4, 28, 8)
  putC(String(rPp),           675, y4, 25, 8)
  putC(String(lPp),           716, y4, 25, 8)
  putC(String(rPp + lPp),     754, y4, 26, 8)

  // ── Classification strip ───────────────────────────────────────────────────
  putC(safeStr(meta.snsR), 163, 50, 23, 8)
  putC(safeStr(meta.snsL), 191, 50, 23, 8)
  putC(safeStr(meta.motR), 163, 36, 23, 8)
  putC(safeStr(meta.motL), 191, 36, 23, 8)
  putC(safeStr(meta.nli),  318, 46, 32, 8)

  const compRaw = safeStr(meta.complete)
  const compChar = compRaw === 'Complete' ? 'C' : compRaw === 'Incomplete' ? 'I' : compRaw
  putC(compChar, 522, 53, 22, 8)
  putC(safeStr(meta.aisGrade), 522, 36, 31, 8)

  // ZPP
  putC(safeStr(meta.zppSns?.r), 714, 50, 23, 8)
  putC(safeStr(meta.zppSns?.l), 741, 50, 24, 8)
  putC(safeStr(meta.zppMot?.r), 714, 36, 23, 8)
  putC(safeStr(meta.zppMot?.l), 741, 36, 24, 8)

  // ── VAC / DAP ──────────────────────────────────────────────────────────────
  putC(safeStr(vac), 139, 152, 29)
  putC(safeStr(dap), 630, 152, 29)

  // ── Download ───────────────────────────────────────────────────────────────
  const filled = await pdfDoc.save()
  const blob = new Blob([filled], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = patientName.replace(/[\s/\\:*?"<>|]+/g, '_') || 'Patient'
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `ASIA_ISNCSCI_${safeName}_${dateStr}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
