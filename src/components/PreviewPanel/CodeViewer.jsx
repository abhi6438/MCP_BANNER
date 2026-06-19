import { useState } from 'react';

export default function CodeViewer({ files }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const codeFiles = files.filter(f => !f.name.endsWith('.md'));
  if (!codeFiles.length) return null;
  return (
    <div className="code-viewer" style={{ display: 'block' }}>
      <div className="code-tabs">
        {codeFiles.map((f, i) => (
          <button
            key={i}
            className={`code-tab${i === activeIdx ? ' active' : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {f.name}
          </button>
        ))}
      </div>
      <pre className="code-panel">{codeFiles[activeIdx]?.content || ''}</pre>
    </div>
  );
}
