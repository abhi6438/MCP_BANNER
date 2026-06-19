export default function UrlList({ urls, sizeTags, onAdd, onRemove, onUpdate }) {
  return (
    <div className="field">
      <label>Figma Banner URLs</label>
      <div className="url-list" id="url-list">
        {urls.map((url, i) => (
          <div key={i} className={`url-row${sizeTags[i] ? ' done' : ''}`}>
            <input
              type="text"
              className="url-input"
              placeholder="https://www.figma.com/file/…"
              value={url}
              onChange={e => onUpdate(i, e.target.value)}
            />
            {sizeTags[i] && <span className="size-tag">{sizeTags[i]}</span>}
            <button type="button" className="btn-remove" onClick={() => onRemove(i)} title="Remove">✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-add-url" onClick={onAdd}>+ Add another banner size</button>
      <div className="hint" style={{ marginTop: 8 }}>
        Select each frame in Figma before copying its URL. Add all sizes — one responsive output will be generated.
      </div>
    </div>
  );
}
