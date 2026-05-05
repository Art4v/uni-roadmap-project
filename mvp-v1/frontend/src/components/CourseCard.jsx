import { useState, useEffect, useRef } from 'react';
import { IconCheck, IconDot, IconAlert, IconSparkle, IconDotsVertical } from '../icons';
import { STATUS_META } from '../constants';

export function CourseCard({
  course,
  status,
  prereqsMissing,
  dragHandlers,
  isDragging,
  isOverlay,
  onRemove,
  onSetStatus,
}) {
  const meta = STATUS_META[status] || STATUS_META.ready;
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const showStatusChip =
    status === 'in-progress' || status === 'blocked' || status === 'ai-recommended';
  const StatusIcon =
    status === 'completed'
      ? IconCheck
      : status === 'in-progress'
        ? IconDot
        : status === 'blocked'
          ? IconAlert
          : status === 'ai-recommended'
            ? IconSparkle
            : null;

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className={[
        'group relative card-status card-enter',
        'border border-zinc-200 border-l-[3px]',
        meta.border,
        meta.bg,
        status === 'ai-recommended' ? 'ai-glow' : 'shadow-sm',
        status === 'completed' ? meta.desaturate : '',
        'rounded-[8px] px-3 py-2.5 select-none',
        isDragging ? 'opacity-40' : '',
        isOverlay ? 'dragging-card' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...(dragHandlers || {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className={[
              'font-mono text-[11px] tracking-tight',
              meta.codeClass || 'text-zinc-500',
            ].join(' ')}
          >
            {course.code}
          </div>
          <div
            className={[
              'mt-0.5 text-[13px] font-medium leading-snug text-balance',
              meta.titleClass || 'text-zinc-900',
            ].join(' ')}
          >
            {course.title}
          </div>
        </div>
        <div className="shrink-0 flex items-start gap-1">
          {!isOverlay && (
            <div ref={menuRef} className="relative">
              <button
                onMouseDown={stop}
                onClick={(e) => {
                  stop(e);
                  setMenuOpen((o) => !o);
                }}
                className={[
                  'rounded p-0.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-opacity',
                  menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                ].join(' ')}
                aria-label="Card actions"
              >
                <IconDotsVertical size={14} />
              </button>
              {menuOpen && (
                <div
                  onMouseDown={stop}
                  className="absolute top-7 right-0 z-30 bg-white border border-zinc-200 rounded-[8px] shadow-md py-1 min-w-[150px]"
                >
                  <div className="px-3 pt-1 pb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                    Set status
                  </div>
                  {[
                    { value: 'ready', label: 'Ready' },
                    { value: 'in-progress', label: 'Current' },
                    { value: 'completed', label: 'Completed' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onMouseDown={stop}
                      onClick={(e) => {
                        stop(e);
                        setMenuOpen(false);
                        onSetStatus && onSetStatus(s.value);
                      }}
                      className="w-full flex items-center justify-between text-left text-[12.5px] text-zinc-700 hover:bg-zinc-100 px-3 py-1.5"
                    >
                      <span>{s.label}</span>
                      {status === s.value && (
                        <span className="text-zinc-500">
                          <IconCheck size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="my-1 border-t border-zinc-100" />
                  <button
                    onMouseDown={stop}
                    onClick={(e) => {
                      stop(e);
                      setMenuOpen(false);
                      onRemove && onRemove();
                    }}
                    className="w-full text-left text-[12.5px] text-red-600 hover:bg-red-50 px-3 py-1.5"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
          {StatusIcon && (
            <div className={['mt-0.5', meta.iconColor].join(' ')}>
              <StatusIcon size={14} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center text-[10.5px] font-medium tracking-tight text-zinc-500 bg-zinc-100 rounded px-1.5 py-0.5">
          {course.uoc} UoC
        </span>
        {showStatusChip && (
          <span
            className={[
              'inline-flex items-center gap-1 text-[10.5px] font-medium rounded-full px-2 py-0.5',
              meta.chipBg,
              meta.chipText,
            ].join(' ')}
          >
            {status === 'in-progress' && <IconDot size={6} />}
            {meta.label}
          </span>
        )}
      </div>

      {/* Tooltip for blocked */}
      {status === 'blocked' && prereqsMissing && prereqsMissing.length > 0 && (
        <div className={['tip', hover ? 'show' : ''].join(' ')}>
          Requires: {prereqsMissing.join(', ')}
        </div>
      )}
    </div>
  );
}
