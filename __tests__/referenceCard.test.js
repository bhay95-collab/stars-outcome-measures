import { buildReferenceCardPdf, REFERENCE_CARD_FILENAME } from '../lib/clinical/referenceCard'
import { MEASURES } from '../lib/clinical/measures'

describe('referenceCard PDF generator', () => {
  let pdfBytes

  beforeAll(async () => {
    pdfBytes = await buildReferenceCardPdf()
  })

  it('produces a non-empty PDF buffer', () => {
    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(1000)
  })

  it('starts with the PDF magic bytes', () => {
    const header = String.fromCharCode(...pdfBytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('exposes a stable filename for the download', () => {
    expect(REFERENCE_CARD_FILENAME).toMatch(/\.pdf$/)
    expect(REFERENCE_CARD_FILENAME).toContain('rehabmetricsiq')
  })

  it('does not throw when registry contains a measure with no MCID or thresholds', () => {
    // ISNCSCI in the registry has chart: null and mcidKey: null — exercising that branch.
    const isncsci = MEASURES['ISNCSCI']
    expect(isncsci).toBeDefined()
    expect(isncsci.chart).toBeNull()
    expect(pdfBytes.length).toBeGreaterThan(0)
  })
})
