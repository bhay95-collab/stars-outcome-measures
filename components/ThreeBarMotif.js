export default function ThreeBarMotif({
  className = '',
  size = 'md',
  tone = 'brand',
  loading = false,
  label = 'Loading',
}) {
  const classes = [
    'three-bar-motif',
    `three-bar-motif--${size}`,
    `three-bar-motif--${tone}`,
    loading ? 'three-bar-motif--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  const ariaProps = loading
    ? { role: 'status', 'aria-label': label }
    : { 'aria-hidden': 'true' }

  return (
    <span className={classes} {...ariaProps}>
      <span className="three-bar-motif__bar" />
      <span className="three-bar-motif__bar" />
      <span className="three-bar-motif__bar" />
      {loading && <span className="three-bar-motif__label">{label}</span>}
      <style jsx>{`
        .three-bar-motif {
          --motif-dark: #0D5C95;
          --motif-mid: #4A9DE8;
          --motif-light: #9BC7F2;
          --motif-width: 18px;
          --motif-gap: 5px;
          --motif-h1: 24px;
          --motif-h2: 44px;
          --motif-h3: 64px;
          --motif-radius: 4px;
          display: inline-grid;
          grid-template-columns: repeat(3, var(--motif-width));
          align-items: end;
          gap: var(--motif-gap);
          width: max-content;
          height: var(--motif-h3);
          vertical-align: middle;
        }

        .three-bar-motif--xs {
          --motif-width: 5px;
          --motif-gap: 2px;
          --motif-h1: 9px;
          --motif-h2: 15px;
          --motif-h3: 22px;
          --motif-radius: 1.5px;
        }

        .three-bar-motif--sm {
          --motif-width: 10px;
          --motif-gap: 3px;
          --motif-h1: 15px;
          --motif-h2: 28px;
          --motif-h3: 42px;
          --motif-radius: 2.5px;
        }

        .three-bar-motif--lg {
          --motif-width: 24px;
          --motif-gap: 7px;
          --motif-h1: 34px;
          --motif-h2: 62px;
          --motif-h3: 92px;
          --motif-radius: 5px;
        }

        .three-bar-motif--light {
          --motif-dark: rgba(255,255,255,0.72);
          --motif-mid: #7FB3E6;
          --motif-light: #DCEEFF;
        }

        .three-bar-motif--muted {
          --motif-dark: rgba(35,100,153,0.48);
          --motif-mid: rgba(90,152,218,0.58);
          --motif-light: rgba(127,179,230,0.62);
        }

        .three-bar-motif__bar {
          display: block;
          width: var(--motif-width);
          border-radius: var(--motif-radius);
          transform-origin: 50% 100%;
        }

        .three-bar-motif__bar:nth-child(1) {
          height: var(--motif-h1);
          background: var(--motif-dark);
        }

        .three-bar-motif__bar:nth-child(2) {
          height: var(--motif-h2);
          background: var(--motif-mid);
        }

        .three-bar-motif__bar:nth-child(3) {
          height: var(--motif-h3);
          background: var(--motif-light);
        }

        .three-bar-motif--loading .three-bar-motif__bar {
          animation: threeBarBuild 1.05s ease-in-out infinite;
        }

        .three-bar-motif--loading .three-bar-motif__bar:nth-child(2) {
          animation-delay: 0.12s;
        }

        .three-bar-motif--loading .three-bar-motif__bar:nth-child(3) {
          animation-delay: 0.24s;
        }

        .three-bar-motif__label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        @keyframes threeBarBuild {
          0%, 100% {
            opacity: 0.62;
            transform: scaleY(0.42);
          }
          45%, 70% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </span>
  )
}
