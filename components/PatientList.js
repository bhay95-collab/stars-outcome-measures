import { useState } from 'react'

export default function PatientList({ patients, selectedId, onSelect, onNew }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? patients.filter(p =>
        (p.initials ?? '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : patients

  return (
    <>
      <style jsx>{styles}</style>
      <div className="panel">
        <div className="panel-head">
          <span className="section-label">Patients</span>
        </div>

        <div className="search-wrap">
          <input
            className="field-input"
            type="text"
            placeholder="Search patients…"
            aria-label="Search patients"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 && patients.length === 0 ? (
          <div className="empty">
            <p className="empty-text">No patients yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p className="empty-text">No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <ul className="list">
            {filtered.map(p => (
              <li
                key={p.id}
                role="button"
                tabIndex={0}
                className={`item${p.id === selectedId ? ' item-active' : ''}`}
                onClick={() => onSelect(p)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(p)}
              >
                <span className="item-initials">{p.initials}</span>
                {p.diagnosis && <span className="item-diagnosis">{p.diagnosis}</span>}
              </li>
            ))}
          </ul>
        )}

        <div className="panel-footer">
          <button className="new-btn" onClick={onNew}>+ New Patient</button>
        </div>
      </div>
    </>
  )
}

const styles = `
  .panel {
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .panel-head {
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
  }

  .search-wrap {
    padding: 12px 12px 8px;
    flex-shrink: 0;
  }

  .field-input {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: var(--color-ink);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 7px 10px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }

  .field-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(35, 100, 153, 0.1);
    background: #fff;
  }

  .field-input::placeholder { color: var(--color-subtle); }

  .empty {
    padding: 32px 16px;
    text-align: center;
    flex: 1;
  }

  .empty-text {
    font-size: 13px;
    color: var(--color-subtle);
    line-height: 1.5;
  }

  .list {
    list-style: none;
    padding: 8px 0;
    overflow-y: auto;
  }

  .item {
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.1s, border-color 0.1s;
    outline: none;
  }

  .item:hover { background: rgba(35, 100, 153, 0.04); }

  .item-active {
    background: var(--color-primary-soft);
    border-left-color: var(--color-primary);
  }

  .item-initials {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
    line-height: 1.4;
  }

  .item-active .item-initials { color: var(--color-primary-dark); }

  .item-diagnosis {
    display: block;
    font-size: 11px;
    color: var(--color-subtle);
    margin-top: 2px;
    font-weight: 400;
  }

  .panel-footer {
    padding: 12px;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .new-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 10px 0;
    width: 100%;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    letter-spacing: 0.1px;
  }

  .new-btn:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-secondary);
  }
`
