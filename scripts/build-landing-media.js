#!/usr/bin/env node
/*
 * Regenerates the landing-page photo variants and the hero background loop.
 *
 * The landing page serves one source photo per slot at its full size. This
 * script derives the responsive WebP/JPEG variants that pages/index.js
 * references via srcSet, and re-encodes the hero loop for delivery.
 *
 * It is a one-off operator script, not part of the build: sharp and
 * ffmpeg-static are heavy and are never needed at runtime or on Vercel, so
 * they are deliberately NOT repo dependencies. Install them just for the run:
 *
 *   npm install --no-save sharp ffmpeg-static
 *   node scripts/build-landing-media.js
 *
 * The hero loop is only re-encoded when you point the script at the original
 * footage, so the delivered file is never re-encoded on top of itself:
 *
 *   node scripts/build-landing-media.js --hero-master ~/footage/hero-master.mp4
 *
 * Commit the regenerated files under public/assets/landing/v2/.
 *
 * Re-run this after replacing any source photo or the hero footage. The
 * `sizes` attributes in pages/index.js are measured from the real layout —
 * if the layout changes, re-measure rather than guessing.
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const sharp = require('sharp')
const ffmpeg = require('ffmpeg-static')

const ROOT = path.join(__dirname, '..')
const LANDING = path.join(ROOT, 'public/assets/landing/v2')

/** Quality settings tuned against the originals — see the commit that added this file. */
const WEBP_QUALITY = 74
const JPEG_QUALITY = 78
/** A QR is flat black-on-white; a 16-colour palette holds the edges at a third of the bytes. */
const QR_PALETTE_COLOURS = 16

/**
 * Widths are derived from the rendered layout (measured at 375/480/768/960/
 * 1100/1280/1440/1920 viewports), covering 1x and 2x device pixel ratios.
 */
const PHOTOS = [
  { source: 'public/assets/landing/v2/clinical-band.jpg', widths: [400, 600, 800, 1200] },
  { source: 'public/assets/landing/v2/pricing.jpg', widths: [400, 600, 800, 1000] },
  { source: 'public/assets/landing/v2/faq-balance.jpg', widths: [420, 640, 900] },
  { source: 'public/founder-ben.jpg', widths: [360, 560, 720] },
]

/** The App Store QR renders at 92px CSS — it only needs 2x and 3x, and must stay lossless. */
const LOSSLESS = [
  { source: 'public/assets/landing/v2/app-store-qr.png', widths: [184, 276] },
]

const HERO_VIDEO = {
  output: 'public/assets/landing/v2/hero-loop.mp4',
  width: 1280,
  height: 720,
  crf: 30,
}

function variantPath(sourcePath, width, extension) {
  const dir = path.dirname(sourcePath)
  const base = path.basename(sourcePath, path.extname(sourcePath))
  return path.join(dir, `${base}-${width}.${extension}`)
}

async function buildPhoto({ source, widths }) {
  const absolute = path.join(ROOT, source)
  const metadata = await sharp(absolute).metadata()

  for (const width of widths) {
    if (width > metadata.width) {
      console.warn(`  skipped ${width}w — wider than the ${metadata.width}px source`)
      continue
    }

    const resized = sharp(absolute).resize({ width, withoutEnlargement: true })

    const webpOut = variantPath(absolute, width, 'webp')
    await resized.clone().webp({ quality: WEBP_QUALITY }).toFile(webpOut)

    const jpegOut = variantPath(absolute, width, 'jpg')
    await resized.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true }).toFile(jpegOut)

    console.log(`  ${width}w  webp ${kb(webpOut)}  jpg ${kb(jpegOut)}`)
  }
}

async function buildLossless({ source, widths }) {
  const absolute = path.join(ROOT, source)

  for (const width of widths) {
    const out = variantPath(absolute, width, 'png')
    await sharp(absolute).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, colours: QR_PALETTE_COLOURS }).toFile(out)
    console.log(`  ${width}w  png ${kb(out)}`)
  }
}

/**
 * The hero loop is a muted, decorative background (aria-hidden), so the audio
 * track is stripped: it is ~1.2MB nobody can hear. `+faststart` moves the moov
 * atom to the front so playback can begin before the download finishes.
 */
function buildHeroVideo({ output, width, height, crf }, masterPath) {
  const temporary = path.join(ROOT, `${output}.tmp.mp4`)

  execFileSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', masterPath,
    '-an', '-sn', '-dn', '-map', '0:v:0',
    '-vf', `scale=${width}:${height}:flags=lanczos`,
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
    '-preset', 'slow', '-crf', String(crf),
    '-pix_fmt', 'yuv420p', '-g', '48',
    '-movflags', '+faststart',
    temporary,
  ], { stdio: 'inherit' })

  fs.renameSync(temporary, path.join(ROOT, output))
  console.log(`  ${width}x${height} crf ${crf} -> ${kb(path.join(ROOT, output))}`)
}

function kb(file) {
  return `${Math.round(fs.statSync(file).size / 1024)}KB`
}

async function main() {
  for (const photo of PHOTOS) {
    console.log(photo.source)
    await buildPhoto(photo)
  }

  for (const asset of LOSSLESS) {
    console.log(asset.source)
    await buildLossless(asset)
  }

  const masterFlag = process.argv.indexOf('--hero-master')
  if (masterFlag === -1) {
    console.log('\nhero loop: skipped — pass --hero-master <file> to re-encode it')
    return
  }

  const masterPath = process.argv[masterFlag + 1]
  if (!masterPath || !fs.existsSync(masterPath)) {
    throw new Error(`--hero-master needs a readable file, got: ${masterPath || '(nothing)'}`)
  }
  if (path.resolve(masterPath) === path.join(ROOT, HERO_VIDEO.output)) {
    throw new Error('--hero-master must be the original footage, not the delivered file — re-encoding an encode loses quality')
  }

  console.log(`\nhero loop from ${masterPath}`)
  buildHeroVideo(HERO_VIDEO, masterPath)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
