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
          <h2 className="panel-title">Patients</h2>
        </div>

        <div className="search-wrap">
          <input
            className="search-input"
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
            <p className="empty-text">No results for "{query}"</p>
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
                <span className="name">{p.initials}</span>
                {p.diagnosis && <span className="condition">{p.diagnosis}</span>}
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
    height: 100%;
    background: var(--color-surface-soft);
  }

  .panel-head {
    padding: 20px 16px 16px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .panel-title {
    font-family: 'Source Serif 4', serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-ink);
    letter-spacing: -0.2px;
  }

  .search-wrap {
    padding: 12px 12px 8px;
    flex-shrink: 0;
  }

  .search-input {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(35,100,153,0.1);
    background: var(--color-surface);
  }

  .search-input::placeholder { color: var(--color-subtle); }

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
    flex: 1;
    overflow-y: auto;
  }

  .item {
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.1s, border-color 0.1s;
    outline: none;
  }

  .item:hover { background: rgba(35,100,153,0.04); }

  .item-active {
    background: var(--color-primary-soft);
    border-left-color: var(--color-primary);
  }

  .name {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
    line-height: 1.4;
  }

  .item-active .name { color: var(--color-primary-dark); }

  .condition {
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
    background: var(--color-surface-soft);
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
