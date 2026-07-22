import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const TIME_BLOCKS = [
  { label: 'Mañana', hours: HOURS.slice(6, 12), icon: '🌤' },
  { label: 'Tarde', hours: HOURS.slice(12, 18), icon: '☀️' },
  { label: 'Noche', hours: HOURS.slice(18, 24), icon: '🌙' },
  { label: 'Madrugada', hours: HOURS.slice(0, 6), icon: '🌑' },
];

interface Props {
  meetingId: string;
  apiUrl: string;
}

export default function AvailabilityGrid({ meetingId, apiUrl }: Props) {
  const [step, setStep] = useState<'name' | 'grid' | 'submitting' | 'done'>('name');
  const [username, setUsername] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeBlock, setActiveBlock] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');
  const [error, setError] = useState('');

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMouseDown = (key: string) => {
    setIsDragging(true);
    const mode = selected.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setSelected(prev => {
      const next = new Set(prev);
      if (mode === 'remove') next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMouseEnter = (key: string) => {
    if (!isDragging) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (dragMode === 'remove') next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setError('Por favor selecciona al menos un horario.');
      return;
    }

    setStep('submitting');
    try {
      const res = await fetch(`${apiUrl}/api/meetings/${meetingId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, availability: [...selected] }),
      });

      if (!res.ok) throw new Error();
      setStep('done');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setError('Algo salió mal. Inténtalo de nuevo.');
      setStep('grid');
    }
  };

  const block = TIME_BLOCKS[activeBlock];

  return (
    <div
      className="availability-island"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <AnimatePresence mode="wait">

        {/* Step 1: Name */}
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="step-name"
          >
            <p className="step-label">Tu nombre</p>
            <input
              type="text"
              className="name-input"
              placeholder="ej. Alex, Jordan…"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && username.trim() && setStep('grid')}
              autoFocus
            />
            <button
              className="btn-continue"
              disabled={!username.trim()}
              onClick={() => setStep('grid')}
            >
              Continuar →
            </button>
          </motion.div>
        )}

        {/* Step 2: Grid */}
        {step === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid-header">
              <p className="grid-greeting">
                Hola <strong>{username}</strong> — arrastra para marcar tu disponibilidad
              </p>
              <span className="selected-count">{selected.size} horarios seleccionados</span>
            </div>

            {/* Block tabs */}
            <div className="block-tabs">
              {TIME_BLOCKS.map((b, i) => (
                <button
                  key={b.label}
                  className={`block-tab ${i === activeBlock ? 'active' : ''}`}
                  onClick={() => setActiveBlock(i)}
                >
                  <span>{b.icon}</span>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid-table" style={{ userSelect: 'none' }}>
              {/* Header row */}
              <div className="grid-row header-row">
                <div className="cell day-header"></div>
                {block.hours.map(h => (
                  <div key={h} className="cell hour-header">{h}</div>
                ))}
              </div>

              {DAYS.map(day => (
                <div key={day} className="grid-row">
                  <div className="cell day-label">{day}</div>
                  {block.hours.map(hour => {
                    const key = `${day}-${hour}`;
                    const isSelected = selected.has(key);
                    return (
                      <motion.div
                        key={key}
                        className={`cell time-cell ${isSelected ? 'selected' : ''}`}
                        onMouseDown={() => handleMouseDown(key)}
                        onMouseEnter={() => handleMouseEnter(key)}
                        onTouchStart={() => toggle(key)}
                        whileTap={{ scale: 0.9 }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="grid-actions">
              <button className="btn-back" onClick={() => setStep('name')}>← Volver</button>
              <button className="btn-submit" onClick={handleSubmit}>
                Enviar disponibilidad
              </button>
            </div>
          </motion.div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="status-screen"
          >
            <div className="spinner" />
            <p>Guardando tu disponibilidad…</p>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="status-screen"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="success-icon"
            >
              ✓
            </motion.div>
            <p>¡Disponibilidad guardada!</p>
          </motion.div>
        )}

      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .availability-island {
          min-height: 200px;
        }

        .step-label {
          font-size: 0.82rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--ink-faint);
          margin-bottom: 0.6rem;
        }

        .name-input {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid var(--border-strong);
          border-radius: 10px;
          font-size: 1rem;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          background: var(--cream-soft);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 1rem;
        }

        .name-input:focus {
          border-color: var(--amber);
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.15);
        }

        .btn-continue {
          padding: 0.7rem 1.5rem;
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }

        .btn-continue:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .btn-continue:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .grid-greeting {
          font-size: 0.9rem;
          color: var(--ink-muted);
        }

        .selected-count {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--amber-dark);
          background: var(--amber-pale);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
        }

        .block-tabs {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }

        .block-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.45rem 0.5rem;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--ink-faint);
          cursor: pointer;
          transition: all 0.15s;
        }

        .block-tab.active {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }

        .block-tab:not(.active):hover {
          border-color: var(--border-strong);
          color: var(--ink-muted);
        }

        .grid-table {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .grid-row {
          display: flex;
        }

        .cell {
          flex: 1;
          min-width: 44px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          font-size: 0.72rem;
        }

        .cell:last-child { border-right: none; }
        .grid-row:last-child .cell { border-bottom: none; }

        .day-header, .hour-header {
          background: var(--cream);
          font-weight: 600;
          color: var(--ink-muted);
          letter-spacing: 0.04em;
        }

        .hour-header {
          font-size: 0.68rem;
          font-family: monospace;
        }

        .day-label {
          background: var(--cream);
          font-weight: 700;
          font-size: 0.78rem;
          color: var(--amber-dark);
          min-width: 40px;
          flex: 0 0 40px;
        }

        .time-cell {
          cursor: pointer;
          background: white;
          transition: background 0.08s;
        }

        .time-cell:hover {
          background: rgba(232, 160, 32, 0.12);
        }

        .time-cell.selected {
          background: var(--amber);
        }

        .time-cell.selected:hover {
          background: var(--amber-dark);
        }

        .error-msg {
          font-size: 0.84rem;
          color: #dc2626;
          margin-top: 0.75rem;
        }

        .grid-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.25rem;
        }

        .btn-back {
          padding: 0.65rem 1rem;
          background: none;
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--ink-faint);
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .btn-back:hover { border-color: var(--ink-muted); color: var(--ink-muted); }

        .btn-submit {
          padding: 0.65rem 1.5rem;
          background: var(--amber);
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(232,160,32,0.4);
        }

        .status-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem 1rem;
          color: var(--ink-muted);
          font-size: 0.95rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--amber);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .success-icon {
          width: 48px;
          height: 48px;
          background: var(--amber);
          color: var(--ink);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 700;
        }
      ` }} />
    </div>
  );
}
