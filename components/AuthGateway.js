import LogoWordmark from './LogoWordmark'
import ThreeBarMotif from './ThreeBarMotif'

export default function AuthGateway({
  className = '',
  title = 'Opening RehabMetrics IQ',
  message = 'Checking your secure session.',
  active = true,
  landingGateway = false,
}) {
  const classes = ['auth-gateway', className].filter(Boolean).join(' ')

  return (
    <main
      className={classes}
      data-active={active ? 'true' : undefined}
      data-landing-auth-gateway={landingGateway ? '' : undefined}
      aria-hidden={active ? undefined : 'true'}
      aria-busy="true"
    >
      <div className="auth-gateway__panel">
        <LogoWordmark size="lg" spaceAfter />
        <ThreeBarMotif size="lg" loading label={title} />
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <style jsx>{`
        .auth-gateway {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          background: #f8f8f2;
          color: #1c2b36;
          font-family: var(--font-inter, -apple-system), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .auth-gateway__panel {
          width: min(100%, 420px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
        }

        .auth-gateway__panel h1 {
          margin: 8px 0 0;
          color: #1c2b36;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 1.2;
        }

        .auth-gateway__panel p {
          max-width: 32ch;
          margin: 0;
          color: #69787a;
          font-size: 14px;
          line-height: 1.55;
        }
      `}</style>
    </main>
  )
}
