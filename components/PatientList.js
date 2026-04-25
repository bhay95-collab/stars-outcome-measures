import { useState } from 'react'

export default function PatientList({ patients, selectedId, onSelect, onNew }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? patients.filter(p => {
        const full = `${p.first_name} ${p.last_name}`.toLowerCase()
        return full.includes(query.trim().toLowerCase())
      })
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
                <span className="name">{p.last_name}, {p.first_name}</span>
                {p.condition && <span className="condition">{p.condition}</span>}
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
  }

  .panel-head {
    padding: 20px 16px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .panel-title {
    font-family: 'Source Serif 4', serif;
    font-size: 17px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .search-wrap {
    padding: 12px 12px 8px;
    flex-shrink: 0;
  }

  .search-input {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: var(--color-ink);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .search-input:focus { border-color: var(--color-primary); background: var(--color-surface); }
  .search-input::placeholder { color: var(--color-subtle); }

  .empty {
    padding: 24px 16px;
    text-align: center;
    flex: 1;
  }

  .empty-text {
    font-size: 13px;
    color: var(--color-subtle);
  }

  .list {
    list-style: none;
    padding: 6px 0;
    flex: 1;
    overflow-y: auto;
  }

  .item {
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.1s;
  }

  .item:hover { background: var(--color-surface-soft); }

  .item-active {
    background: var(--color-primary-soft);
    border-left-color: var(--color-primary);
  }

  .name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
    line-height: 1.3;
  }

  .condition {
    display: block;
    font-size: 11px;
    color: var(--color-muted);
    margin-top: 2px;
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
    background: var(--color-primary-soft);
    border: none;
    border-radius: var(--radius-sm);
    padding: 12px 0;
    width: 100%;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .new-btn:hover { opacity: 0.8; }
`
