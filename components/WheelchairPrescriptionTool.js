import { ClipboardCopy, FileText, Printer, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import wheelchairPrescriptionMarkup from './wheelchairPrescriptionMarkup'

export default function WheelchairPrescriptionTool({ patient }) {
  const rootRef = useRef(null)
  const storageKey = useMemo(
    () => `rehabmetrics:wheelchair-prescription:${patient?.id ?? 'standalone'}`,
    [patient?.id]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const $ = (id) => root.querySelector(`#${id}`)
    const qsa = (sel) => Array.from(root.querySelectorAll(sel))
    const val = (id) => ($(id)?.value || '').trim()
    const rad = (name) => root.querySelector(`input[name="${name}"]:checked`)?.value || ''
    const checks = (name) => qsa(`input[name="${name}"]:checked`).map(x => x.value)
    const join = (arr) => arr.filter(Boolean).join(', ')
    const line = (label, value) => value ? `${label}: ${value}\n` : ''
    const autoCalcIds = ['reqSeatWidth', 'proposedOverallWidth', 'reqSeatDepth', 'reqSeatHeight', 'reqBackHeight', 'cushionProfile', 'headSupport', 'proposedCushion', 'proposedBackrest', 'seatAngleTilt', 'backrestRecline', 'legrestAngle', 'armSupport']
    let applyingAuto = false

    function fieldRows(ids) {
      return ids.map(([label, id]) => line(label, val(id))).join('')
    }

    function measurementSummary() {
      const rows = [
        ['A Buttock/thigh depth', 'A'], ['B Lower leg length', 'B'], ['C Foot length', 'C'], ['D Ischial well length', 'D'],
        ['E Seat to elbow', 'E'], ['F PSIS', 'F'], ['G Inferior scapula', 'G'], ['H Axilla', 'H'],
        ['I Top of shoulder', 'I'], ['J Top of head', 'J'], ['K Shoulder width', 'K'], ['L Chest width', 'L'],
        ['M Hip width', 'M'], ['N External knee width', 'N'], ['O Internal knee width', 'O'], ['P External ankle/foot', 'P'],
      ]
      let out = ''
      rows.forEach(([label, code]) => {
        const l = val(`meas${code}_L`)
        const r = val(`meas${code}_R`)
        if (l || r) out += `${label}: L/value ${l || '-'} mm | R ${r || '-'} mm\n`
      })
      if (val('overallWidthNotes')) out += `Overall/asymmetry notes: ${val('overallWidthNotes')}\n`
      return out || 'No measurements entered yet.\n'
    }

    function activitySummary() {
      const acts = ['Eating', 'Grooming', 'Bathing', 'Dressing - upper body', 'Dressing - lower body', 'Toileting', 'Bed/chair/wheelchair transfer', 'Toilet transfer', 'Shower/bath transfer', 'Propel', 'Reposition / pressure relieve', 'Reach / pick up objects', 'Navigate tight spaces', 'Manage ramps / inclines / curbs', 'Cross streets / community safety']
      let out = ''
      acts.forEach((act, i) => {
        const level = val(`act_${i}`)
        const note = val(`actNote_${i}`)
        if (level || note) out += `${act}: ${level || '-'}${note ? ` - ${note}` : ''}\n`
      })
      return out
    }

    function buildSupplierBriefText() {
      let text = ''
      text += 'WHEELCHAIR PRESCRIPTION - SUPPLIER BRIEF\n'
      text += '=========================================\n\n'
      text += '1. CLIENT / REFERRAL\n'
      text += fieldRows([['Client', 'clientName'], ['Date of assessment', 'assessmentDate'], ['DOB', 'dob'], ['Weight kg', 'weight'], ['Primary diagnosis', 'primaryDx'], ['Other diagnosis', 'otherDx'], ['Funding pathway', 'fundingBody'], ['Reason for referral', 'reasonReferral']])
      text += line('Mobility/seating goals', val('mobilityGoals'))
      text += line('Productivity/recreation context', join([val('productivity'), val('recreation')]))
      text += line('Remoteness', rad('remoteness'))
      text += line('Wheelchair use', rad('wcTime'))
      text += line('Carers', join(checks('carers')))
      text += '\n2. KEY CLINICAL RISKS\n'
      text += line('Condition', rad('conditionStatus'))
      text += line('Impairment areas', join(checks('impairment')))
      text += line('Pressure injury history', rad('historyPI'))
      text += line('Sensation', rad('sensation'))
      text += line('Current pressure injury', rad('currentPI'))
      text += line('PI stage/location', join([val('piStage'), val('piLocation')]))
      text += line('Seating-related skin risk', join([val('seatingRelated'), val('seatingRiskFactors')]))
      text += line('Current pressure management', val('pressureManagement'))
      text += line('Bariatric flag', $('bariatricFlag') && $('bariatricFlag').checked ? 'Flagged' : '')
      text += line('Bariatric features', join(checks('bariatricFeatures')))
      text += line('Wound care referral required', rad('woundReferral'))
      text += '\n3. MEASUREMENTS IN PROPOSED POSITION\n'
      text += measurementSummary()
      text += '\n4. CURRENT EQUIPMENT\n'
      text += line('Current base', rad('seatingBase'))
      text += line('Manufacturer/model', val('currentModel'))
      text += line('Age/condition', join([val('baseAge'), val('baseCondition')]))
      text += line('Current base status', rad('currentBaseMeets'))
      text += line('Client comments', val('currentBaseComments'))
      text += line('Manual type', join(checks('manualCurrentType')))
      text += line('Propulsion', rad('propulsion'))
      text += line('Power add-on', join([join(checks('powerAddon')), val('powerAddonOther')]))
      text += line('Drive wheel config', rad('driveConfig'))
      text += line('Current power seat functions', join(checks('currentSeatFunctions')))
      text += line('Current power seat size', join([val('currentSeatWidth') && `${val('currentSeatWidth')} mm wide`, val('currentSeatDepth') && `${val('currentSeatDepth')} mm deep`]))
      text += line('Current cushion', join([val('currentCushion'), val('currentCushionSize'), val('currentCushionMeets')]))
      text += line('Current backrest', join([val('currentBackrest'), val('currentBackrestSize'), val('currentBackrestMeets')]))
      text += line('Current accessories', join(checks('currentAccessories')))
      text += line('Current seating info', val('currentSeatingInfo'))
      text += '\n5. FUNCTION / ENVIRONMENT SUMMARY\n'
      text += line('Sitting balance', rad('sittingBalance'))
      text += line('Functional activities', activitySummary().trim())
      text += line('Door widths', val('doorWidths'))
      text += line('Thresholds', val('thresholds'))
      text += line('Turning circles', val('turningCircles'))
      text += line('Bed/chair heights', val('surfaceHeights'))
      text += line('Internal surfaces', join(checks('internalSurfaces')))
      text += line('External terrain', join(checks('externalTerrain')))
      text += line('Steepest ramp/slope', val('steepestSlope'))
      text += line('Community environment', val('communityEnvironment'))
      text += line('Transport', join(checks('transport')))
      text += line('Travel position', rad('travelPosition'))
      text += line('Transport details', val('transportDetails'))
      text += '\n6. POSTURE / MAT SUMMARY\n'
      text += line('MAT completed on plinth', rad('matCompleted'))
      text += line('Pelvis seated', join([rad('pelvisSag'), rad('pelvisFront'), rad('pelvisTrans')]))
      text += line('Supine pelvic findings', join([rad('supinePelvicTilt'), rad('tiltFlex'), rad('supineRotation'), rad('rotationFlex'), rad('supineObliquity'), rad('obliquityFlex')]))
      text += line('Lower extremity findings', join(checks('lowerExt')))
      text += line('Spine/cervical/shoulder findings', join(checks('spineCervical')))
      text += line('Tone/movement', join(checks('toneMovement')))
      text += line('ROM notes', val('romNotes'))
      text += line('Simulation findings/proposed posture', val('simulationFindings'))
      text += '\n7. PROPOSED PRODUCT PARAMETERS\n'
      text += 'Auto-calculation note: Dimension fields are starting points generated from Section 2 measurements. Overall wheelchair width is estimated from seat width + 200 mm unless overwritten with the supplier\'s confirmed outside-to-outside width. Overwrite any auto field where MAT findings, posture, pressure care, transfers, propulsion, supplier measurement conventions or trial outcomes indicate a better fit.\n'
      text += line('Likely prescription pathway', rad('proposedPathway'))
      text += line('Preferred suppliers to contact', val('supplierPreference') || join(checks('suppliers')))
      text += line('Reason for base direction', val('baseDirectionReason'))
      text += fieldRows([['Required seat width mm', 'reqSeatWidth'], ['Estimated/proposed overall wheelchair width mm', 'proposedOverallWidth'], ['Required seat depth mm', 'reqSeatDepth'], ['Required front seat height mm', 'reqSeatHeight'], ['Required backrest height', 'reqBackHeight'], ['Cushion profile', 'cushionProfile'], ['Head support', 'headSupport'], ['Cushion recommendation', 'proposedCushion'], ['Backrest recommendation', 'proposedBackrest'], ['Seat angle/tilt', 'seatAngleTilt'], ['Backrest recline', 'backrestRecline'], ['Legrest angle/support', 'legrestAngle'], ['Arm support', 'armSupport']])
      text += line('Postural supports', join(checks('posturalSupports')))
      text += line('Belts/secondary supports', join(checks('beltsSupports')))
      text += line('Support descriptors/mounting', val('posturalSupportDescriptors'))
      text += line('Manual prescription source', join([rad('proposedPathway'), join(checks('manualCurrentType'))]))
      text += line('Frame material', join(checks('frameMaterial')))
      text += line('Manual wheels/drive', join(checks('manualWheels')))
      text += line('Manual accessories', join(checks('manualAccessories')))
      text += line('Manual configuration notes', val('manualConfigNotes'))
      text += line('Power drive to trial', rad('proposedDrive'))
      text += line('Power seat functions', join(checks('proposedSeatFunctions')))
      text += line('Power controls', val('powerControls'))
      text += line('Power base/seating notes', val('powerBaseNotes'))
      text += line('Charging/storage', val('powerChargingNotes'))
      text += '\n8. TRIAL / QUOTE / HANDOVER\n'
      text += line('Trial locations', join(checks('trialLocations')))
      text += line('Potential trial equipment', val('trialEquipment'))
      text += line('Products trialled/outcomes', val('productsTrialled'))
      text += line('Selected equipment', val('selectedEquipment'))
      text += line('Quote instructions', val('quoteInstructions'))
      text += line('Fitting/training items', join(checks('trainingChecklist')))
      text += line('Training/follow-up notes', val('trainingNotes'))
      text += line('Barriers to goals', val('barriersToGoals'))
      text += line('Postural/mobility issues', val('identifiedIssues'))
      text += line('Product parameters summary', val('productParametersSummary'))
      text += '\nRequested supplier response: itemised quote, trial availability, proposed products that match the clinical parameters, lead time, setup/fitting requirements, warranty, maintenance/repair pathway, freight/delivery cost, and any product constraints that may affect goals, transport or environment.\n'
      return text.replace(/\n{3,}/g, '\n\n')
    }

    function parseMmValues(text) {
      const values = []
      const re = /(\d+(?:\.\d+)?)\s*(mm|cm|m)?/gi
      let match
      while ((match = re.exec(String(text || ''))) !== null) {
        let n = Number(match[1])
        const unit = (match[2] || 'mm').toLowerCase()
        if (!Number.isFinite(n)) continue
        if (unit === 'm') n *= 1000
        if (unit === 'cm') n *= 10
        if (n >= 100) values.push(Math.round(n))
      }
      return values
    }

    function narrowestDoorWidth() {
      const values = parseMmValues(val('doorWidths'))
      return values.length ? Math.min(...values) : 0
    }

    function estimatedOverallWidthFromSeatWidth() {
      const seatWidth = Number(val('reqSeatWidth') || 0)
      return seatWidth ? Math.round(seatWidth + 200) : 0
    }

    function proposedWheelchairWidth() {
      return Number(val('proposedOverallWidth') || 0) || estimatedOverallWidthFromSeatWidth()
    }

    function boolHighRiskPressure() {
      return rad('currentPI') === 'Yes' || rad('historyPI') === 'Yes' || ['Impaired', 'Absent'].includes(rad('sensation')) || val('seatingRiskFactors') === 'Yes'
    }

    function hasBariatricFlag() {
      const flag = $('bariatricFlag')
      return !!(flag && flag.checked) || checks('bariatricFeatures').length > 0
    }

    function hasComplexPosture() {
      const fixed = [rad('tiltFlex'), rad('rotationFlex'), rad('obliquityFlex')].includes('Non-reducible')
      const spine = checks('spineCervical').some(v => ['Scoliosis convex right', 'Scoliosis convex left', 'Thoracic kyphosis', 'Spinal rotation R', 'Spinal rotation L'].includes(v))
      const pelvis = [rad('pelvisSag'), rad('pelvisFront'), rad('pelvisTrans')].some(v => v && v !== 'Neutral')
      return fixed || spine || pelvis || checks('lowerExt').some(v => v.includes('Wind') || v.includes('adducted') || v.includes('abducted'))
    }

    function maxPair(code) {
      return Math.max(Number(val(`meas${code}_L`) || 0), Number(val(`meas${code}_R`) || 0))
    }

    function roundTo(value, step = 10) {
      if (!value || value <= 0) return ''
      return String(Math.max(0, Math.round(value / step) * step))
    }

    function setGuide(id, html) {
      const el = $(id)
      if (el) el.innerHTML = html
    }

    function setAutoValue(id, value, force = false) {
      const el = $(id)
      if (!el || value === undefined || value === null || value === '') return
      const manual = el.dataset.manual === 'true'
      const wasAuto = el.dataset.auto === 'true'
      if (force || !manual || wasAuto || !el.value.trim()) {
        applyingAuto = true
        el.value = value
        el.dataset.auto = 'true'
        el.dataset.manual = 'false'
        applyingAuto = false
      }
    }

    function initAutoCalcTracking() {
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (!el) return
        const markManual = () => {
          if (!applyingAuto) {
            el.dataset.manual = 'true'
            el.dataset.auto = 'false'
          }
        }
        el.addEventListener('input', markManual)
        el.addEventListener('change', markManual)
      })
    }

    function calculationInputs() {
      const pressureRisk = boolHighRiskPressure()
      const complexPosture = hasComplexPosture()
      const poorBalance = ['Sitting with propping', 'Unable to sit without support'].includes(rad('sittingBalance'))
      const fullTime = rad('wcTime') === 'Full-time use'
      const independentManual = ['Independent full-time', 'Independent part-time'].includes(rad('propulsion')) || /manual/i.test(rad('proposedPathway')) || checks('manualCurrentType').length > 0
      return {
        hip: maxPair('M'),
        depth: maxPair('A'),
        lowerLeg: maxPair('B'),
        scap: maxPair('G'),
        axilla: maxPair('H'),
        shoulder: maxPair('I'),
        head: maxPair('J'),
        seatToElbow: maxPair('E'),
        externalKnee: maxPair('N'),
        ankleWidth: maxPair('P'),
        pressureRisk,
        complexPosture,
        poorBalance,
        fullTime,
        independentManual,
        powerSeatFunctions: checks('proposedSeatFunctions'),
      }
    }

    function suggestedBackHeight(c) {
      if (val('headSupport') === 'Yes' && c.head) return `${c.head} mm to top-of-head support level`
      if ((c.poorBalance || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) && c.shoulder) return `${c.shoulder} mm to top of shoulder`
      if (c.complexPosture && c.axilla) return `${c.axilla} mm to axilla level - refine for laterals/head clearance`
      if (c.independentManual && c.scap) return `${c.scap} mm to inferior scapula - preserves shoulder movement for propulsion`
      if (c.axilla) return `${c.axilla} mm to axilla level`
      if (c.scap) return `${c.scap} mm to inferior scapula`
      if (c.shoulder) return `${c.shoulder} mm to top of shoulder`
      if (c.head) return `${c.head} mm to top of head`
      return ''
    }

    function applyAutoCalculations(force = false) {
      const c = calculationInputs()
      if (c.hip) setAutoValue('reqSeatWidth', roundTo(c.hip + 30), force)
      const seatWidthForOverall = Number(val('reqSeatWidth') || (c.hip ? roundTo(c.hip + 30) : 0))
      if (seatWidthForOverall) setAutoValue('proposedOverallWidth', String(Math.round(seatWidthForOverall + 200)), force)
      if (c.depth) setAutoValue('reqSeatDepth', roundTo(c.depth - (c.depth >= 430 ? 50 : 35)), force)
      if (c.lowerLeg) setAutoValue('reqSeatHeight', roundTo(c.lowerLeg + 25), force)
      const back = suggestedBackHeight(c)
      if (back) setAutoValue('reqBackHeight', back, force)
      setAutoValue('cushionProfile', (c.pressureRisk || c.fullTime || c.poorBalance) ? 'High profile 3 inch +' : 'Low profile 1-2 inch', force)
      setAutoValue('headSupport', (c.poorBalance || rad('travelPosition') === 'In wheelchair' || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) ? 'Yes' : 'No', force)

      let cushion = 'General positioning cushion to trial; confirm comfort, stability, transfers and skin response.'
      if (c.pressureRisk && c.complexPosture) cushion = 'Pressure-redistributing contoured cushion to trial; confirm pelvic stability, offloading, skin response and transfer impact.'
      else if (c.pressureRisk) cushion = 'Pressure-redistributing cushion to trial; document pressure relief routine and follow-up skin review.'
      else if (c.complexPosture) cushion = 'Contoured positioning cushion to trial; match to pelvic/lower-limb alignment and reducibility.'
      setAutoValue('proposedCushion', cushion, force)

      let backrest = 'Standard or tension-adjustable backrest to trial; confirm comfort, reach and propulsion/functional access.'
      if (c.complexPosture && c.poorBalance) backrest = 'Contoured supportive backrest with lateral support to trial; confirm level of correction/accommodation from MAT.'
      else if (c.complexPosture) backrest = 'Contoured or tension-adjustable backrest to trial; consider lateral/pelvic supports based on MAT findings.'
      else if (c.poorBalance) backrest = 'Higher supportive backrest to trial; confirm trunk stability, reach, comfort and caregiver access.'
      setAutoValue('proposedBackrest', backrest, force)

      setAutoValue('seatAngleTilt', (c.pressureRisk || c.poorBalance || c.complexPosture || c.fullTime)
        ? 'Tilt-in-space / adjustable seat angle to trial; confirm pressure relief, pelvic stability, gaze, function and transfer impact.'
        : 'Standard 0-5 deg or mild dump only if it improves stability/propulsion without limiting function.', force)
      setAutoValue('backrestRecline', (c.pressureRisk || c.powerSeatFunctions.some(v => /recline/i.test(v)))
        ? 'Recline only with clear care/rest/pressure rationale; verify shear, sliding, belt position and return-to-function.'
        : 'Standard/fixed recline unless comfort, care tasks or fatigue management require adjustment.', force)
      setAutoValue('legrestAngle', c.lowerLeg
        ? `Set footplate/leg support from lower leg length B ${c.lowerLeg} mm; consider angle-adjustable footplates or calf/heel support if ROM, tone, swelling or foot position requires.`
        : 'Use lower leg length B, ROM, tone, swelling, foot position and transfer needs to set legrest angle/support.', force)
      setAutoValue('armSupport', c.seatToElbow
        ? `Seat-to-elbow E ${c.seatToElbow} mm; trial height-adjustable armrests/arm troughs to keep shoulders level and support transfers/reach.`
        : 'Use seat-to-elbow E to set arm support height; confirm reach, transfers, shoulder position and table access.', force)
    }

    function reapplyAutoCalculations() {
      if (!window.confirm('Re-apply auto-calculated starting points and overwrite any manual edits in the key seating dimension fields?')) return
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (el) {
          el.dataset.manual = 'false'
          el.dataset.auto = 'true'
        }
      })
      applyAutoCalculations(true)
      updateAll(true)
    }

    function updateDimensionGuidance() {
      applyAutoCalculations(false)
      const c = calculationInputs()
      setGuide('guide_reqSeatWidth', c.hip ? `<strong>Auto-start:</strong> ${roundTo(c.hip + 30)} mm from hip width M ${c.hip} mm + approx. 30 mm clearance. Overwrite for asymmetry, tissue shape, clothing, lateral supports, hand access, transfers or supplier sizing.` : '<strong>Auto-start:</strong> Enter hip width M to calculate a starting seat width.')
      const doorWidth = narrowestDoorWidth()
      const overallWidth = proposedWheelchairWidth()
      const seatWidth = Number(val('reqSeatWidth') || 0)
      const overallSource = val('proposedOverallWidth') ? 'Current overall-width value' : 'Estimated overall width'
      const accessEscalation = !!(overallWidth && doorWidth && overallWidth >= doorWidth)
      if (overallWidth && doorWidth) {
        setGuide('guide_proposedOverallWidth', accessEscalation
          ? `<strong>Escalation:</strong> ${overallSource} ${overallWidth} mm is equal to or wider than the narrowest recorded door width ${doorWidth} mm. This is based on seat width ${seatWidth || '-'} mm + 200 mm unless overwritten. Confirm supplier total width, hand rims/tyres, clear opening, door swing, thresholds and approach before quoting.`
          : `<strong>Door check:</strong> ${overallSource} ${overallWidth} mm is narrower than the narrowest recorded door width ${doorWidth} mm. This estimate uses seat width ${seatWidth || '-'} mm + 200 mm unless overwritten; still confirm supplier total width and trial through the narrowest doorway.`)
      } else if (overallWidth) {
        setGuide('guide_proposedOverallWidth', `<strong>Auto-estimate:</strong> ${overallWidth} mm from seat width ${seatWidth || '-'} mm + 200 mm. Enter measured clear door openings to trigger the access flag. Overwrite once supplier outside-to-outside width is confirmed.`)
      } else {
        setGuide('guide_proposedOverallWidth', '<strong>Door check:</strong> Enter required seat width to estimate overall wheelchair width, then enter measured clear door openings to trigger the access flag.')
      }
      $('guide_proposedOverallWidth')?.classList.toggle('access-warning', accessEscalation)
      setGuide('guide_reqSeatDepth', c.depth ? `<strong>Auto-start:</strong> ${roundTo(c.depth - (c.depth >= 430 ? 50 : 35))} mm from buttock/thigh depth A ${c.depth} mm, allowing posterior knee clearance. Overwrite after cushion/backrest and simulated posture are confirmed.` : '<strong>Auto-start:</strong> Enter buttock/thigh depth A to calculate starting seat depth.')
      setGuide('guide_reqSeatHeight', c.lowerLeg ? `<strong>Auto-start:</strong> ${roundTo(c.lowerLeg + 25)} mm from lower leg length B ${c.lowerLeg} mm + approx. footwear/clearance allowance. Confirm whether supplier measures to seat pan or cushion top.` : '<strong>Auto-start:</strong> Enter lower leg length B to calculate starting front seat height.')
      const backText = suggestedBackHeight(c)
      setGuide('guide_reqBackHeight', backText ? `<strong>Auto-start:</strong> ${backText}. Overwrite based on trunk control, propulsion, lateral support, head support and comfort during trial.` : '<strong>Auto-start:</strong> Enter PSIS, inferior scapula, axilla, shoulder and head measurements to guide support height.')
      setGuide('guide_cushionProfile', (c.pressureRisk || c.fullTime || c.poorBalance) ? '<strong>Auto-start:</strong> High profile selected because pressure risk, full-time use or reduced sitting balance is present. Overwrite if transfer height, propulsion, posture or supplier cushion choice requires.' : '<strong>Auto-start:</strong> Low profile selected as a simple starting point where pressure risk is not yet identified. Overwrite if skin, stability or posture needs require more immersion/contour.')
      setGuide('guide_headSupport', (c.poorBalance || rad('travelPosition') === 'In wheelchair' || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) ? '<strong>Auto-start:</strong> Head support selected because balance, transport or power seat functions may require it. Confirm by trial.' : '<strong>Auto-start:</strong> No head support selected unless balance, transport, fatigue, recline/tilt or positioning indicates otherwise.')
      setGuide('guide_proposedCushion', c.pressureRisk ? '<strong>Reasoning:</strong> Skin/sensation findings require explicit pressure-distribution, relief routine and follow-up skin review.' : '<strong>Reasoning:</strong> Match cushion to pelvic stability, posture, transfers, sitting tolerance and daily use.')
      setGuide('guide_proposedBackrest', c.complexPosture ? '<strong>Reasoning:</strong> Postural findings require backrest contour/support decisions from MAT: correct, partially correct or accommodate.' : '<strong>Reasoning:</strong> Match backrest height and contour to trunk control, arm function, comfort and propulsion/reach.')
      setGuide('guide_seatAngleTilt', (c.pressureRisk || c.poorBalance || c.complexPosture) ? '<strong>Reasoning:</strong> Tilt/seat angle may be needed for pressure, stability, fatigue or supported sitting. Confirm effect on function and transfers.' : '<strong>Reasoning:</strong> Keep simple unless mild dump/tilt improves stability or function.')
      setGuide('guide_backrestRecline', (c.pressureRisk || c.powerSeatFunctions.some(v => /recline/i.test(v))) ? '<strong>Reasoning:</strong> Recline can assist rest/care but can also increase shear/sliding. Trial with tilt and belt position.' : '<strong>Reasoning:</strong> Use recline only if it has a clear functional, care or comfort purpose.')
      setGuide('guide_legrestAngle', c.lowerLeg || c.externalKnee || c.ankleWidth ? `<strong>Measurement link:</strong> Lower leg B ${c.lowerLeg || '-'} mm, external knee width N ${c.externalKnee || '-'} mm and ankle/foot width P ${c.ankleWidth || '-'} mm guide leg support, hanger angle and footplate width.` : '<strong>Measurement link:</strong> Enter lower leg B, knee N and foot/ankle P measurements to guide leg support.')
      setGuide('guide_armSupport', c.seatToElbow ? `<strong>Auto-start:</strong> Use seat-to-elbow E ${c.seatToElbow} mm to trial armrest/arm-trough height. Overwrite if shoulder posture, transfers, tray/table access or propulsion require.` : '<strong>Auto-start:</strong> Enter seat-to-elbow E to guide arm support height.')
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
    }

    function card(title, items, risk = '') {
      if (!items || !items.length) return ''
      return `<div class="guidance-card ${risk}"><h4>${escapeHtml(title)}</h4><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`
    }

    function missing(items) {
      return items.filter(([, idOrFn]) => typeof idOrFn === 'function' ? !idOrFn() : !val(idOrFn)).map(x => x[0])
    }

    function renderGuidance() {
      const highRisk = []
      const pathway = []
      const posture = []
      const measurement = []
      const trial = []
      const gaps = []

      if (boolHighRiskPressure()) highRisk.push('Skin/pressure risk is active or likely. Prioritise cushion selection, pressure relief strategy, skin check/wound care input where indicated, and follow-up after delivery.')
      if (rad('currentPI') === 'Yes') highRisk.push('Current pressure injury: avoid final equipment decisions without clear wound plan and pressure-management rationale. Consider pressure mapping or specialist seating input where available.')
      if (rad('sittingBalance') === 'Unable to sit without support' || rad('sittingBalance') === 'Sitting with propping') highRisk.push('Reduced sitting balance: backrest height, lateral support, pelvic stability, tilt and caregiver access need explicit trial goals.')
      if (hasComplexPosture()) highRisk.push('Postural asymmetry/deformity recorded. Use MAT findings to decide whether to correct toward midline, partially correct, or accommodate. Do not simulate beyond available ROM.')
      if (checks('impairment').includes('Cognitive') || checks('impairment').includes('Sensory')) highRisk.push('Cognitive/sensory issues affect mobility safety, training requirements and carer controls. Document screening and risk controls.')
      if (rad('conditionStatus') === 'Deteriorating' || rad('conditionStatus') === 'Fluctuating') highRisk.push('Condition is not stable. Consider adjustability, future growth/change, review timing and funding justification for changing needs.')
      if (rad('travelPosition') === 'In wheelchair') highRisk.push('Transport in wheelchair requires confirmation of wheelchair tie-down/occupant restraint compatibility and transport assessment.')
      const doorWidth = narrowestDoorWidth()
      const overallWidth = proposedWheelchairWidth()
      if (overallWidth && doorWidth && overallWidth >= doorWidth) highRisk.push(`Doorway access escalation: proposed overall wheelchair width ${overallWidth} mm is equal to or greater than the narrowest recorded door width ${doorWidth} mm. Do not finalise quote until total chair width, clear opening, door swing, hand rims/tyres, thresholds and turning approach are confirmed.`)
      if (hasBariatricFlag()) highRisk.push('Bariatric flag recorded. Check safe working load, tissue distribution, cushion loading, seat width/depth, transfer method, doorway clearance, hoist/handling plan and follow-up pressure review.')

      const wcTime = rad('wcTime')
      const propulsion = rad('propulsion')
      if (rad('proposedPathway')) pathway.push(`Clinician-selected pathway: ${rad('proposedPathway')}. Use this as a trial direction, not the final prescription, until function/environment/fit are verified.`)
      else if (boolHighRiskPressure() || hasComplexPosture() || wcTime === 'Full-time use') pathway.push('Likely needs scripted seating rather than a basic loan/hire chair because risk, posture or full-time use increases the cost of a poor fit.')
      else if (propulsion === 'Dependent') pathway.push('Dependent mobility: consider attendant-propelled manual or manual tilt-in-space depending goals, pressure needs and carer capacity.')
      else if (propulsion.includes('Independent')) pathway.push('Independent propulsion: prioritise efficient configuration, seat-to-floor height, rear axle position, shoulder preservation, access to brakes/wheels and real-world terrain trial.')
      else pathway.push('Enter propulsion, wheelchair-use duration and goals to sharpen likely equipment pathway.')
      if (checks('externalTerrain').some(v => ['Grass/soft ground', 'Gravel/dirt', 'Uneven terrain', 'Hills', 'Steep ramps', 'Curbs'].includes(v))) pathway.push('Environment includes difficult terrain/gradients. Trial castor/wheel size, tyre type, frame setup or power assist in the real environment where possible.')
      if (checks('manualAccessories').includes('Power assist required') || rad('proposedPathway') === 'Manual chair plus power assist') pathway.push('Power assist reasoning should link to fatigue, shoulder preservation, slopes, community distance, independence and ability to manage setup/charging/transport.')

      if (rad('pelvisSag') === 'Posterior pelvic tilt' || rad('supinePelvicTilt') === 'Posterior pelvic tilt') posture.push('Posterior pelvic tilt: check seat depth, hamstring length, pelvic belt angle, lumbar support, pre-ischial contour and seat-to-back angle.')
      if (rad('pelvisSag') === 'Anterior pelvic tilt' || rad('supinePelvicTilt') === 'Anterior pelvic tilt') posture.push('Anterior pelvic tilt/lordosis: check pelvic stability, anterior trunk support needs, cushion contour and whether hip flexor tightness limits neutral sitting.')
      if (rad('pelvisFront') && rad('pelvisFront') !== 'Neutral') posture.push('Pelvic obliquity: decide whether it is reducible. Reducible may need gentle correction/support; fixed usually needs accommodation to avoid pressure concentration.')
      if (rad('pelvisTrans') && rad('pelvisTrans') !== 'Neutral') posture.push('Pelvic rotation: consider cushion contour, pelvic/thigh guides, lateral supports and foot positioning to prevent migration.')
      if (checks('spineCervical').some(v => v.includes('Scoliosis'))) posture.push('Scoliosis: start from pelvic position, then trial backrest contour/laterals to support trunk while preserving reach, respiration, comfort and transfers.')
      if (checks('spineCervical').includes('Thoracic kyphosis')) posture.push('Thoracic kyphosis: check backrest shape/height, head/neck posture, gaze, swallowing/respiration and ability to reach/propel.')
      if (checks('lowerExt').some(v => v.includes('Wind'))) posture.push('Windswept/asymmetrical lower limbs: confirm overall width, thigh/foot support, cushion contour and whether chair width must accommodate asymmetry without excessive overall width.')
      if (!posture.length) posture.push('Postural guidance will appear here as pelvis, spine, lower-limb and MAT fields are completed.')

      const hip = maxPair('M')
      const depth = maxPair('A')
      const leg = maxPair('B')
      if (hip) measurement.push(`Hip width entered: ${hip} mm. Seat width commonly starts slightly wider than measured hip width to allow clothing and tissue clearance, then is refined against posture, transfers, hand access and supplier sizing.`)
      if (depth) measurement.push(`Buttock/thigh depth entered: ${depth} mm. Seat depth should support the thigh without loading behind the knee; verify with cushion/backrest choice and proposed pelvic position.`)
      if (leg) measurement.push(`Lower leg length entered: ${leg} mm. Seat-to-floor and footplate height must account for cushion height, footwear, footplate clearance and propulsion/transfer method.`)
      if (val('reqSeatWidth') || val('reqSeatDepth') || val('reqSeatHeight')) measurement.push('Required product dimensions have been entered. Confirm whether these are body measurements, final chair dimensions, or trial starting points before sending to supplier.')
      if (val('reqSeatWidth') && overallWidth) measurement.push(`Estimated overall wheelchair width: ${overallWidth} mm from seat width ${val('reqSeatWidth')} mm + 200 mm allowance unless the supplier outside-to-outside width has been manually entered.`)
      if (hasBariatricFlag()) measurement.push(`Bariatric features recorded${checks('bariatricFeatures').length ? `: ${join(checks('bariatricFeatures'))}` : ''}. Validate the auto-calculated seat dimensions against tissue distribution, pannus/gluteal shelf, thigh position, postural support, safe working load and pressure care strategy.`)
      if (overallWidth && doorWidth && overallWidth < doorWidth) measurement.push(`Doorway check: proposed overall wheelchair width ${overallWidth} mm is narrower than the narrowest recorded door width ${doorWidth} mm. Still confirm clear opening, hand rims/tyres, thresholds and approach during trial.`)
      if (!hip && !depth && !leg) measurement.push('Enter proposed-position measurements A, B and M early. These drive seat depth, lower-leg/seat-to-floor setup and seat width decisions.')

      trial.push('Ask suppliers to respond with trial availability, itemised quote, product constraints, lead time, setup/fitting requirements and maintenance pathway.')
      if (checks('trialLocations').length) trial.push(`Trial location(s) selected: ${join(checks('trialLocations'))}. Make sure each location tests a specific goal or risk.`)
      if (checks('externalTerrain').length || val('steepestSlope')) trial.push('Trial must include the hardest expected terrain/slope or a safe equivalent before finalising wheel/base configuration.')
      if (val('doorWidths') || val('turningCircles')) trial.push('Compare estimated/proposed overall wheelchair width and turning radius against measured clear door widths and turning spaces before quote finalisation.')
      if (rad('travelPosition')) trial.push('Transport plan should be checked during trial/fitting, including transfer method or wheelchair transport restraints.')
      if (checks('trainingChecklist').length) trial.push('Training items are selected; ensure the supplier/fitting plan identifies who trains the client/carers and when follow-up occurs.')

      missing([
        ['client goals', 'mobilityGoals'], ['funding pathway', 'fundingBody'], ['weight', 'weight'], ['pressure history/sensation', () => rad('historyPI') && rad('sensation')],
        ['proposed-position measurements', () => val('measA_L') || val('measM_L') || val('measM_R')], ['propulsion status', () => rad('propulsion') || rad('proposedPathway')],
        ['environment constraints', () => val('doorWidths') || checks('externalTerrain').length || val('communityEnvironment')], ['overall wheelchair width for door check', () => !val('doorWidths') || proposedWheelchairWidth()], ['trial equipment', 'trialEquipment'],
      ]).forEach(g => gaps.push(g))

      let html = ''
      html += card('Escalation / risk flags', highRisk.length ? highRisk : ['No major risk flags yet. Continue completing skin, posture, cognition/sensation, environment and transport fields before relying on this.'], highRisk.length ? 'risk-high' : 'risk-low')
      html += card('Likely equipment reasoning', pathway, pathway.length > 1 ? 'risk-mod' : '')
      html += card('Posture and seating reasoning', posture, hasComplexPosture() ? 'risk-mod' : '')
      html += card('Measurement checks', measurement, '')
      html += card('Trial and supplier handover priorities', trial, '')
      html += card('Missing information before supplier handover', gaps.length ? gaps.map(g => `Add: ${g}.`) : ['Core supplier handover fields are reasonably complete.'], gaps.length ? 'risk-mod' : 'risk-low')
      const guidance = $('guidanceOutput')
      if (guidance) guidance.innerHTML = html
    }

    function buildSupplierBriefHTML() {
      const lines = buildSupplierBriefText().split('\n')
      const sections = []
      let current = null
      lines.forEach(raw => {
        const cleanLine = raw.trim()
        if (!cleanLine || /^=+$/.test(cleanLine)) return
        if (cleanLine === 'WHEELCHAIR PRESCRIPTION - SUPPLIER BRIEF') return
        if (/^\d+\.\s+/.test(cleanLine)) {
          current = { heading: cleanLine, rows: [] }
          sections.push(current)
          return
        }
        if (!current) return
        const idx = cleanLine.indexOf(':')
        if (idx > 0 && idx < 80) current.rows.push({ label: cleanLine.slice(0, idx), value: cleanLine.slice(idx + 1).trim() })
        else current.rows.push({ label: '', value: cleanLine })
      })
      const client = escapeHtml(val('clientName') || 'Client not entered')
      const date = escapeHtml(val('assessmentDate') || new Date().toLocaleDateString())
      let html = `<div class="print-title"><h1>Wheelchair Prescription - Supplier Brief</h1><p>${client} - ${date} - generated from assessment tool</p></div>`
      html += '<div class="print-note"><strong>Clinical note:</strong> This supplier brief is generated from the assessment form. Auto-calculated dimensions are starting points only and must be checked against posture, pressure care, function, transfers, supplier measurement conventions and trial outcomes.</div>'
      sections.forEach(sec => {
        html += `<section class="print-section"><h2>${escapeHtml(sec.heading)}</h2>`
        sec.rows.forEach(row => {
          if (row.label) html += `<div class="print-row"><div class="print-label">${escapeHtml(row.label)}</div><div class="print-value">${escapeHtml(row.value)}</div></div>`
          else html += `<div class="print-paragraph">${escapeHtml(row.value)}</div>`
        })
        html += '</section>'
      })
      return html
    }

    function updateManualSourceSummary() {
      const el = $('manualSourceSummary')
      if (!el) return
      const pathway = rad('proposedPathway') || 'No prescription pathway selected yet'
      const selectedManual = join(checks('manualCurrentType')) || 'No manual chair class selected in Section 2 yet'
      el.innerHTML = `<strong>Linked source:</strong> Proposed pathway: ${escapeHtml(pathway)}. Manual chair class already captured in Section 2: ${escapeHtml(selectedManual)}. Use the configuration notes below to specify the proposed frame setup, axle/CxG, transport needs, material and trial changes.`
    }

    function toggleSection(sectionId, button) {
      const section = $(sectionId)
      if (!section) return
      const collapsed = section.classList.toggle('is-collapsed')
      if (button) button.textContent = collapsed ? 'Expand' : 'Minimise'
    }

    function setAllSectionsCollapsed(collapsed = true) {
      qsa('.section').forEach(section => {
        section.classList.toggle('is-collapsed', collapsed)
        const btn = section.querySelector('.section-toggle')
        if (btn) btn.textContent = collapsed ? 'Expand' : 'Minimise'
      })
    }

    function toggleBariatricPanel() {
      const panel = $('bariatricPanel')
      const flag = $('bariatricFlag')
      if (panel) panel.hidden = !(flag && flag.checked)
    }

    function syncConditionalPanels() {
      toggleBariatricPanel()
    }

    function saveFormState() {
      const form = $('wcForm')
      if (!form) return
      const fields = {}
      const radios = {}
      const checkboxGroups = {}
      qsa('input, textarea, select').forEach(el => {
        if (el.type === 'radio') {
          if (el.checked) radios[el.name] = el.value
        } else if (el.type === 'checkbox') {
          if (!checkboxGroups[el.name]) checkboxGroups[el.name] = []
          if (el.checked) checkboxGroups[el.name].push(el.value)
        } else if (el.id) {
          fields[el.id] = el.value
        }
      })
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify({ fields, radios, checkboxGroups }))
      } catch {
        // Session storage is an enhancement; the tool still works without it.
      }
    }

    function restoreFormState() {
      let raw = null
      try {
        raw = window.sessionStorage.getItem(storageKey)
      } catch {
        return false
      }
      if (!raw) return false
      try {
        const data = JSON.parse(raw)
        Object.entries(data.fields || {}).forEach(([id, value]) => {
          const el = $(id)
          if (el) el.value = value
        })
        Object.entries(data.radios || {}).forEach(([name, value]) => {
          const el = root.querySelector(`input[type="radio"][name="${name}"][value="${CSS.escape(value)}"]`)
          if (el) el.checked = true
        })
        Object.entries(data.checkboxGroups || {}).forEach(([name, values]) => {
          const selected = new Set(values)
          qsa(`input[type="checkbox"][name="${name}"]`).forEach(el => {
            el.checked = selected.has(el.value)
          })
        })
        return true
      } catch {
        return false
      }
    }

    function prefillFromPatient() {
      if (patient?.initials && $('clientName')) $('clientName').value = patient.initials
      if (patient?.diagnosis && $('primaryDx')) $('primaryDx').value = patient.diagnosis
    }

    function updateAll(shouldSave = true) {
      syncConditionalPanels()
      updateDimensionGuidance()
      const supplierBrief = $('supplierBrief')
      if (supplierBrief) supplierBrief.textContent = buildSupplierBriefText()
      renderGuidance()
      updateManualSourceSummary()
      if (shouldSave) saveFormState()
    }

    function writeClipboard(text, successMessage) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => window.alert(successMessage))
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
        window.alert(successMessage)
      }
    }

    function copySupplierBrief() {
      writeClipboard(buildSupplierBriefText(), 'Supplier brief copied.')
    }

    function copyClinicalReasoningGuide() {
      renderGuidance()
      const text = $('guidanceOutput') ? $('guidanceOutput').innerText.trim() : ''
      const headerParts = ['CLINICAL REASONING GUIDE']
      if (val('clientName')) headerParts.push(`Client: ${val('clientName')}`)
      if (val('assessmentDate')) headerParts.push(`Date: ${val('assessmentDate')}`)
      writeClipboard(`${headerParts.join('\n')}\n\n${text || 'No clinical reasoning generated yet. Complete the assessment fields first.'}`, 'Clinical reasoning guide copied.')
    }

    function printSupplierBrief() {
      const printSupplier = $('printSupplier')
      if (!printSupplier) return
      printSupplier.innerHTML = buildSupplierBriefHTML()
      document.body.dataset.wcPrint = 'supplier'
      setTimeout(() => window.print(), 50)
    }

    function printAssessmentForm() {
      document.body.dataset.wcPrint = 'assessment'
      setTimeout(() => window.print(), 50)
    }

    function clearForm() {
      if (!window.confirm('Clear all entered data from this form?')) return
      $('wcForm')?.reset()
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (el) {
          delete el.dataset.auto
          delete el.dataset.manual
        }
      })
      try {
        window.sessionStorage.removeItem(storageKey)
      } catch {}
      updateAll(false)
    }

    function initialiseFormState() {
      $('wcForm')?.reset()
      const restored = restoreFormState()
      if (!restored) prefillFromPatient()
      setAllSectionsCollapsed(true)
      updateAll(!restored)
    }

    const form = $('wcForm')
    const handleFormChange = () => updateAll(true)
    const handleAfterPrint = () => {
      document.body.dataset.wcPrint = ''
    }

    initAutoCalcTracking()
    form?.addEventListener('input', handleFormChange)
    form?.addEventListener('change', handleFormChange)
    window.addEventListener('afterprint', handleAfterPrint)

    const globals = { toggleSection, toggleBariatricPanel, reapplyAutoCalculations, copySupplierBrief, copyClinicalReasoningGuide, printSupplierBrief, printAssessmentForm, clearForm }
    Object.assign(window, globals)
    initialiseFormState()

    return () => {
      form?.removeEventListener('input', handleFormChange)
      form?.removeEventListener('change', handleFormChange)
      window.removeEventListener('afterprint', handleAfterPrint)
      Object.entries(globals).forEach(([key, fn]) => {
        if (window[key] === fn) delete window[key]
      })
    }
  }, [patient?.diagnosis, patient?.initials, storageKey])

  return (
    <section className="wc-tool" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: wheelchairToolStyles }} />
      <div className="wc-tool__header">
        <div>
          <span className="wc-tool__eyebrow">Clinical Support Tool</span>
          <h2>Prescription Workspace</h2>
          <p>Decision support only. Confirm recommendations through trial, clinical review, supplier specifications and local funding requirements.</p>
        </div>
        <div className="wc-tool__actions">
          <button type="button" data-primary="" onClick={() => window.copySupplierBrief?.()}>
            <ClipboardCopy size={15} /> Supplier brief
          </button>
          <button type="button" onClick={() => window.copyClinicalReasoningGuide?.()}>
            <FileText size={15} /> Reasoning guide
          </button>
          <button type="button" onClick={() => window.printSupplierBrief?.()}>
            <Printer size={15} /> Brief
          </button>
          <button type="button" onClick={() => window.printAssessmentForm?.()}>
            <Printer size={15} /> Form
          </button>
          <button type="button" data-danger="" onClick={() => window.clearForm?.()}>
            <RotateCcw size={15} /> Clear
          </button>
        </div>
      </div>
      <div className="wc-tool__content" dangerouslySetInnerHTML={{ __html: wheelchairPrescriptionMarkup }} />
      <div className="wc-tool__print-supplier" id="printSupplier" />
    </section>
  )
}

export const wheelchairToolStyles = `
  .wc-tool {
    --wc-ink: var(--color-ink);
    --wc-muted: var(--color-muted);
    --wc-subtle: var(--color-subtle);
    --wc-line: var(--color-border);
    --wc-surface: rgba(255,255,255,0.74);
    --wc-soft: var(--color-surface-soft);
    --wc-primary: var(--color-primary);
    --wc-primary-dark: var(--color-primary-dark);
    --wc-primary-soft: var(--color-primary-soft);
    --wc-secondary: var(--color-secondary);
    --wc-danger: #b5451b;
    color: var(--wc-ink);
    font-family: 'Inter', sans-serif;
  }

  .wc-tool,
  .wc-tool * {
    box-sizing: border-box;
  }

  .wc-tool h2,
  .wc-tool h3,
  .wc-tool h4,
  .wc-tool p,
  .wc-tool ul,
  .wc-tool ol,
  .wc-tool figure {
    margin: 0;
    padding: 0;
  }

  .wc-tool button,
  .wc-tool input,
  .wc-tool textarea,
  .wc-tool select {
    font: inherit;
  }

  .wc-tool__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
    padding: 20px 22px;
    border: 1px solid rgba(216,225,234,0.9);
    border-radius: 16px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.84), rgba(247,250,252,0.72)),
      radial-gradient(circle at 100% 0%, rgba(120,200,189,0.14), transparent 34%);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(16px);
  }

  .wc-tool__eyebrow {
    display: block;
    margin-bottom: 6px;
    color: var(--wc-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  .wc-tool__header h2 {
    margin: 0;
    color: var(--wc-ink);
    font-size: 24px;
    line-height: 1.1;
    font-weight: 800;
  }

  .wc-tool__header p {
    max-width: 820px;
    margin-top: 6px;
    color: var(--wc-muted);
    font-size: 13px;
    line-height: 1.55;
  }

  .wc-tool__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    justify-content: flex-end;
    gap: 8px;
    min-width: 330px;
  }

  .wc-tool__actions button,
  .wc-tool .btn,
  .wc-tool .section-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    padding: 0 13px;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    background: rgba(255,255,255,0.82);
    color: var(--wc-primary);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .wc-tool__actions button:hover,
  .wc-tool .btn:hover,
  .wc-tool .section-toggle:hover {
    border-color: rgba(23,61,104,0.35);
    background: #fff;
  }

  .wc-tool__actions button[data-primary] {
    border-color: transparent;
    background: linear-gradient(180deg, #214d81, #173d68);
    box-shadow: 0 8px 18px rgba(23,61,104,0.22);
    color: #fff;
  }

  .wc-tool__actions button[data-danger] {
    color: var(--wc-danger);
  }

  .wc-tool__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
    gap: 18px;
    align-items: start;
  }

  .wc-tool .main-panel,
  .wc-tool .sidebar {
    min-width: 0;
  }

  .wc-tool .sidebar {
    position: sticky;
    top: 18px;
    display: grid;
    gap: 14px;
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-gutter: stable;
  }

  .wc-tool .card,
  .wc-tool .side-card {
    overflow: hidden;
    margin-bottom: 16px;
    border: 1px solid rgba(216,225,234,0.95);
    border-radius: 16px;
    background: var(--wc-surface);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(16px);
  }

  .wc-tool .side-card {
    margin-bottom: 0;
  }

  .wc-tool .section-header {
    position: relative;
    min-height: 72px;
    padding: 18px 132px 16px 20px;
    border-bottom: 1px solid var(--wc-line);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.82), rgba(247,250,252,0.74));
  }

  .wc-tool .section-header h2 {
    margin: 0;
    color: var(--wc-ink);
    font-size: 18px;
    line-height: 1.2;
    font-weight: 800;
  }

  .wc-tool .section-header p {
    margin-top: 5px;
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .wc-tool .section-toggle {
    position: absolute;
    top: 16px;
    right: 18px;
    min-width: 88px;
  }

  .wc-tool .section.is-collapsed .section-body {
    display: none;
  }

  .wc-tool .section.is-collapsed .section-header {
    border-bottom: 0;
  }

  .wc-tool .section-body {
    padding: 18px 20px 22px;
  }

  .wc-tool .side-card h3 {
    margin: 0;
    padding: 13px 15px;
    border-bottom: 1px solid var(--wc-line);
    background: rgba(247,250,252,0.84);
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .wc-tool .side-body {
    padding: 14px 15px;
  }

  .wc-tool .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
  }

  .wc-tool .span-12 { grid-column: span 12; }
  .wc-tool .span-9 { grid-column: span 9; }
  .wc-tool .span-8 { grid-column: span 8; }
  .wc-tool .span-6 { grid-column: span 6; }
  .wc-tool .span-5 { grid-column: span 5; }
  .wc-tool .span-4 { grid-column: span 4; }
  .wc-tool .span-3 { grid-column: span 3; }
  .wc-tool .span-2 { grid-column: span 2; }

  .wc-tool label.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
  }

  .wc-tool .span-12 > strong,
  .wc-tool .span-9 > strong,
  .wc-tool .span-8 > strong,
  .wc-tool .span-6 > strong,
  .wc-tool .span-5 > strong,
  .wc-tool .span-4 > strong,
  .wc-tool .span-3 > strong,
  .wc-tool .span-2 > strong,
  .wc-tool .option-panel > strong {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .wc-tool label.field .hint {
    color: var(--wc-muted);
    font-size: 11px;
    font-weight: 500;
  }

  .wc-tool input[type="text"],
  .wc-tool input[type="date"],
  .wc-tool input[type="number"],
  .wc-tool select,
  .wc-tool textarea {
    width: 100%;
    min-height: 38px;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    background: rgba(255,255,255,0.94);
    color: var(--wc-ink);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    padding: 8px 10px;
    outline: none;
  }

  .wc-tool textarea {
    min-height: 78px;
    resize: vertical;
    line-height: 1.45;
  }

  .wc-tool input:focus,
  .wc-tool select:focus,
  .wc-tool textarea:focus {
    border-color: rgba(23,61,104,0.6);
    box-shadow: 0 0 0 3px rgba(23,61,104,0.10);
    background: #fff;
  }

  .wc-tool .subhead {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 22px 0 12px;
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .wc-tool .subhead:first-child {
    margin-top: 0;
  }

  .wc-tool .subhead::before {
    content: "";
    width: 4px;
    height: 16px;
    border-radius: 99px;
    background: var(--wc-secondary);
  }

  .wc-tool .check-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .wc-tool .check-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wc-tool .check-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }

  .wc-tool .check,
  .wc-tool .radio {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    min-height: 38px;
    padding: 9px 10px;
    border: 1px solid rgba(216,225,234,0.95);
    border-radius: 8px;
    background: rgba(247,250,252,0.82);
    color: #334155;
    font-size: 12px;
    line-height: 1.3;
  }

  .wc-tool .check:hover,
  .wc-tool .radio:hover {
    border-color: rgba(23,61,104,0.26);
    background: rgba(255,255,255,0.96);
  }

  .wc-tool .check:has(input:checked),
  .wc-tool .radio:has(input:checked) {
    border-color: rgba(23,61,104,0.36);
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
  }

  .wc-tool .check input,
  .wc-tool .radio input {
    flex: 0 0 auto;
    margin-top: 2px;
    accent-color: var(--wc-primary);
  }

  .wc-tool .note,
  .wc-tool .guidance-line {
    border: 1px solid #d7e4ef;
    border-radius: 8px;
    background: rgba(232,241,251,0.82);
    color: #284b63;
    font-size: 12px;
    line-height: 1.5;
    padding: 10px 12px;
  }

  .wc-tool .guidance-line {
    margin-top: 6px;
    background: rgba(247,250,252,0.9);
    color: var(--wc-muted);
  }

  .wc-tool .guidance-line.access-warning {
    border-color: #f0b8a2;
    background: #fdf0ec;
    color: #9a3a16;
  }

  .wc-tool .measurement-layout {
    display: grid;
    grid-template-columns: minmax(420px, 1.05fr) minmax(320px, 0.8fr);
    gap: 16px;
    align-items: start;
  }

  .wc-tool .measurement-table,
  .wc-tool .activity-table {
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(255,255,255,0.92);
    font-size: 12px;
  }

  .wc-tool .measurement-table th,
  .wc-tool .activity-table th {
    padding: 9px;
    background: rgba(239,244,249,0.96);
    color: var(--wc-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    text-align: left;
  }

  .wc-tool .measurement-table td,
  .wc-tool .activity-table td {
    padding: 7px 9px;
    border-top: 1px solid var(--wc-line);
    vertical-align: middle;
  }

  .wc-tool .measurement-table tr:hover td,
  .wc-tool .activity-table tr:hover td {
    background: rgba(247,250,252,0.72);
  }

  .wc-tool .measurement-table input,
  .wc-tool .activity-table input,
  .wc-tool .activity-table select {
    min-height: 34px;
    padding: 6px 8px;
  }

  .wc-tool .measure-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wc-tool .measure-code {
    display: inline-grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    border: 1px solid #cfe0ee;
    border-radius: 999px;
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
    font-weight: 800;
  }

  .wc-tool .visual-card,
  .wc-tool .selection-card,
  .wc-tool .option-panel,
  .wc-tool .conditional-panel {
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    background: rgba(255,255,255,0.88);
    padding: 12px;
  }

  .wc-tool .visual-card img,
  .wc-tool .selection-card img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid #edf3f7;
    border-radius: 8px;
    background: #fff;
    object-fit: contain;
  }

  .wc-tool .body-chart-img {
    max-height: 540px;
  }

  .wc-tool .visual-caption,
  .wc-tool .card-caption,
  .wc-tool .footer-note {
    margin-top: 8px;
    color: var(--wc-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .wc-tool .selection-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .wc-tool .selection-card {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .wc-tool .selection-card:hover {
    border-color: rgba(23,61,104,0.26);
    box-shadow: 0 10px 24px rgba(21,34,56,0.08);
  }

  .wc-tool .selection-card img {
    aspect-ratio: 1 / 1;
  }

  .wc-tool .selection-card h4 {
    margin: 0;
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .wc-tool .manual-propulsion-layout {
    display: grid;
    grid-template-columns: minmax(240px, 0.8fr) minmax(320px, 1.2fr);
    gap: 12px;
  }

  .wc-tool .power-addon-panel .check-grid {
    grid-template-columns: repeat(4, minmax(100px, 1fr));
  }

  .wc-tool .dimension-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 12px;
  }

  .wc-tool .guidance-card {
    margin-bottom: 10px;
    padding: 12px;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    background: rgba(255,255,255,0.9);
  }

  .wc-tool .guidance-card h4 {
    margin: 0 0 7px;
    color: var(--wc-primary);
    font-size: 13px;
  }

  .wc-tool .guidance-card ul {
    margin: 0;
    padding-left: 18px;
    color: #3b4b5d;
    font-size: 12px;
    line-height: 1.45;
  }

  .wc-tool .guidance-card li {
    margin: 4px 0;
  }

  .wc-tool .risk-high {
    border-color: #f0b8a2;
    background: #fdf0ec;
  }

  .wc-tool .risk-mod {
    border-color: #f5d49a;
    background: #fef3e2;
  }

  .wc-tool .risk-low {
    border-color: #b7dfc9;
    background: #e8f4ef;
  }

  .wc-tool .brief-preview {
    min-height: 520px;
    max-height: calc(100vh - 310px);
    overflow: auto;
    white-space: pre-wrap;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    background: #f8fafc;
    color: #243445;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.45;
    padding: 12px;
  }

  .wc-tool .links-list {
    margin: 0;
    padding-left: 18px;
    color: #3b4b5d;
    font-size: 12px;
    line-height: 1.45;
  }

  .wc-tool .links-list li {
    margin-bottom: 8px;
  }

  .wc-tool .links-list a {
    color: var(--wc-primary);
  }

  .wc-tool__print-supplier {
    display: none;
  }

  .wc-tool__print-supplier .print-title {
    border-bottom: 2px solid var(--wc-primary);
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .wc-tool__print-supplier .print-title h1 {
    margin: 0 0 4px;
    color: var(--wc-primary);
    font-size: 22px;
  }

  .wc-tool__print-supplier .print-title p,
  .wc-tool__print-supplier .print-note,
  .wc-tool__print-supplier .print-row,
  .wc-tool__print-supplier .print-paragraph {
    font-size: 11px;
    line-height: 1.35;
  }

  .wc-tool__print-supplier .print-note {
    margin: 8px 0 12px;
    padding: 8px 10px;
    border: 1px solid #f5d49a;
    border-radius: 8px;
    background: #fef3e2;
  }

  .wc-tool__print-supplier .print-section {
    overflow: hidden;
    margin: 12px 0 16px;
    border: 1px solid var(--wc-line);
    border-radius: 8px;
    break-inside: avoid;
  }

  .wc-tool__print-supplier .print-section h2 {
    margin: 0;
    padding: 8px 10px;
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
    font-size: 14px;
  }

  .wc-tool__print-supplier .print-row {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 8px;
    padding: 6px 10px;
    border-top: 1px solid #eef3f7;
  }

  .wc-tool__print-supplier .print-label {
    color: #334155;
    font-weight: 800;
  }

  .wc-tool__print-supplier .print-value,
  .wc-tool__print-supplier .print-paragraph {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .wc-tool__print-supplier .print-paragraph {
    padding: 7px 10px;
    border-top: 1px solid #eef3f7;
  }

  @media (max-width: 1320px) {
    .wc-tool__content,
    .wc-tool .measurement-layout {
      grid-template-columns: 1fr;
    }

    .wc-tool .sidebar {
      position: static;
      max-height: none;
      overflow: visible;
    }

    .wc-tool .brief-preview {
      max-height: 460px;
      min-height: 320px;
    }
  }

  @media (max-width: 960px) {
    .wc-tool__header {
      flex-direction: column;
    }

    .wc-tool__actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      min-width: 0;
      width: 100%;
    }

    .wc-tool .grid,
    .wc-tool .dimension-grid,
    .wc-tool .selection-cards,
    .wc-tool .manual-propulsion-layout {
      grid-template-columns: 1fr;
    }

    .wc-tool .span-12,
    .wc-tool .span-9,
    .wc-tool .span-8,
    .wc-tool .span-6,
    .wc-tool .span-5,
    .wc-tool .span-4,
    .wc-tool .span-3,
    .wc-tool .span-2 {
      grid-column: span 1;
    }

    .wc-tool .check-grid,
    .wc-tool .check-grid.two,
    .wc-tool .check-grid.four,
    .wc-tool .power-addon-panel .check-grid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    body[data-wc-print] .app-sidebar,
    body[data-wc-print] .page-toolbar,
    body[data-wc-print] .wc-tool__header {
      display: none !important;
    }

    body[data-wc-print] .app-main {
      padding: 0 !important;
      overflow: visible !important;
    }

    body[data-wc-print="supplier"] .wc-tool__content {
      display: none !important;
    }

    body[data-wc-print="supplier"] .wc-tool__print-supplier {
      display: block !important;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
      color: #182331;
    }

    body[data-wc-print="assessment"] .wc-tool__content {
      display: block !important;
    }

    body[data-wc-print="assessment"] .wc-tool .sidebar {
      display: none !important;
    }

    body[data-wc-print="assessment"] .wc-tool .card {
      box-shadow: none !important;
      break-inside: avoid;
    }

    body[data-wc-print="assessment"] .wc-tool .section.is-collapsed .section-body {
      display: block !important;
    }

    body[data-wc-print="assessment"] .wc-tool .section-toggle {
      display: none !important;
    }
  }
`
