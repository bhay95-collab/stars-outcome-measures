export default function LogoWordmark({ href, className = '', size = 'md', spaceAfter = false, showMark = true }) {
  const classes = [
    'logo-wordmark',
    `logo-wordmark--${size}`,
    spaceAfter ? 'logo-wordmark--space-after' : '',
    className,
  ].filter(Boolean).join(' ')
  const content = (
    <>
      {showMark && <img className="logo-wordmark__mark" src="/SquareLogo.png" alt="" aria-hidden="true" />}
      <span>RehabMetrics</span>
      <span className="logo-wordmark__iq">IQ</span>
      <style jsx>{`
        .logo-wordmark {
          display: inline-flex;
          align-items: center;
          gap: 0.28em;
          color: #1f3045;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: 0;
          text-decoration: none;
          white-space: nowrap;
        }

        .logo-wordmark__mark {
          width: 1em;
          height: 1em;
          border-radius: 4px;
          object-fit: cover;
          flex: 0 0 auto;
        }

        .logo-wordmark--sm { font-size: 18px; }
        .logo-wordmark--md { font-size: 22px; }
        .logo-wordmark--lg { font-size: 32px; }
        .logo-wordmark--space-after { margin-bottom: 28px; }

        .logo-wordmark__iq {
          color: #8da4b6;
          font-style: italic;
          font-weight: 600;
        }
      `}</style>
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes} aria-label="RehabMetrics IQ home">
        {content}
      </a>
    )
  }

  return <div className={classes}>{content}</div>
}
