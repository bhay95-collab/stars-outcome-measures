export default function PatientList({ patients, selectedId, onSelect, onNew }) {
  return (
    <>
      <style jsx>{styles}</style>
      <div className="list-header">
        <span className="list-title">Patients</span>
        <button className="new-btn" onClick={onNew}>+ New</button>
      </div>

      {patients.length === 0 ? (
        <div className="empty">
          <p className="empty-text">No patients yet.</p>
          <button className="first-btn" onClick={onNew}>Add first patient</button>
        </div>
      ) : (
        <ul className="list">
          {patients.map(p => (
            <li
              key={p.id}
              className={`item${p.id === selectedId ? ' item-active' : ''}`}
              onClick={() => onSelect(p)}
            >
              <span className="name">{p.last_name}, {p.first_name}</span>
              {p.condition && <span className="condition">{p.condition}</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const styles = `
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .list-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--color-subtle);
  }

  .new-btn {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border: none;
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .new-btn:hover { opacity: 0.8; }

  .empty {
    padding: 32px 16px;
    text-align: center;
  }

  .empty-text {
    font-size: 13px;
    color: var(--color-subtle);
    margin-bottom: 12px;
  }

  .first-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-primary);
    background: none;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    padding: 6px 14px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .first-btn:hover { opacity: 0.75; }

  .list {
    list-style: none;
    padding: 6px 0;
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
`
