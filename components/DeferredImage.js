/**
 * Landing-page image that defers its own download until it is near the viewport.
 *
 * The deferral is done by the browser (`loading="lazy"`), not by JavaScript, so
 * the URL is present in the server-rendered HTML. That matters on slow
 * connections: the preload scanner can queue the image while the JS bundle is
 * still downloading, and the image still appears if the bundle never arrives.
 */
export default function DeferredImage({
  alt,
  className,
  decoding = 'async',
  fetchPriority,
  height,
  loading = 'lazy',
  sizes,
  src,
  srcSet,
  width,
}) {
  return (
    <img
      alt={alt}
      className={className}
      decoding={decoding}
      fetchPriority={fetchPriority}
      height={height}
      loading={loading}
      sizes={sizes}
      src={src}
      srcSet={srcSet}
      width={width}
    />
  )
}
