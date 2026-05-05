import { useState, useEffect, useRef, useId } from 'react';
import {
  IconCheck,
  IconDot,
  IconAlert,
  IconSparkle,
  IconChevron,
  IconPlus,
  IconLogo,
  IconDotsVertical,
} from './icons.jsx';

// ---------- single-open menu coordinator ----------
// Shared module-level state so only one CourseCard menu can be open at a time.
// Each card subscribes via useCurrentMenuId() and re-renders when the open id changes.
const _menuListeners = new Set();
let _currentMenuId = null;
function setCurrentMenu(id) {
  if (_currentMenuId === id) return;
  _currentMenuId = id;
  _menuListeners.forEach((fn) => fn(id));
}
function useCurrentMenuId() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    _menuListeners.add(fn);
    return () => {
      _menuListeners.delete(fn);
    };
  }, []);
  return _currentMenuId;
}

// Approximate full menu height (header + 3 status rows + divider + remove + py-1).
// Used to decide whether the dropdown should flip above the trigger.
const MENU_EST_HEIGHT = 200;

// ---------- status definitions ----------
export const STATUS_META = {
  completed: {
    label: 'Completed',
    border: 'border-l-emerald-500',
    bg: 'bg-white',
    chipBg: 'bg-emerald-50',
    chipText: 'text-emerald-700',
    iconColor: 'text-emerald-600',
    titleClass: 'text-zinc-500',
    codeClass: 'text-zinc-400',
    desaturate: 'opacity-80',
  },
  'in-progress': {
    label: 'Current',
    border: 'border-l-blue-500',
    bg: 'bg-white',
    chipBg: 'bg-blue-50',
    chipText: 'text-blue-700',
    iconColor: 'text-blue-600',
  },
  ready: {
    label: 'Ready',
    border: 'border-l-zinc-200',
    bg: 'bg-white',
  },
  blocked: {
    label: 'Blocked',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/40',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-700',
    iconColor: 'text-amber-600',
  },
  'ai-recommended': {
    label: 'Recommended',
    border: 'border-l-indigo-500',
    bg: 'bg-white',
    chipBg: 'bg-indigo-50',
    chipText: 'text-indigo-700',
    iconColor: 'text-indigo-500',
  },
};

// ---------- Course Card ----------
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
  const myMenuId = useId();
  const openMenuId = useCurrentMenuId();
  const menuOpen = openMenuId === myMenuId;
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [flipUp, setFlipUp] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCurrentMenu(null);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setCurrentMenu(null);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    if (menuOpen) {
      setCurrentMenu(null);
      return;
    }
    const rect = buttonRef.current && buttonRef.current.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setFlipUp(spaceBelow < MENU_EST_HEIGHT && spaceAbove > spaceBelow);
    } else {
      setFlipUp(false);
    }
    setCurrentMenu(myMenuId);
  };

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
                ref={buttonRef}
                onMouseDown={stop}
                onClick={(e) => {
                  stop(e);
                  toggleMenu();
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
                  className={[
                    'absolute right-0 z-30 bg-white border border-zinc-200 rounded-[8px] shadow-md py-1 min-w-[150px]',
                    flipUp ? 'bottom-7' : 'top-7',
                  ].join(' ')}
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
                        setCurrentMenu(null);
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
                      setCurrentMenu(null);
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

// ---------- Term Cell (drop target) ----------
export function TermCell({
  termKey,
  instances,
  dropActive,
  registerRef,
  term,
  getCourse,
  getStatus,
  getMissing,
  dragInstanceId,
  onDragStart,
  onRemove,
  onSetStatus,
  onAddClick,
}) {
  const isEmpty = instances.length === 0;
  const totalUoc = instances.reduce((s, i) => s + (getCourse(i.code).uoc || 0), 0);
  return (
    <div
      ref={(el) => registerRef(termKey, el)}
      data-term-key={termKey}
      className={[
        'rounded-[10px] p-2.5 transition-colors duration-150 min-h-[120px]',
        'bg-zinc-50/60 ring-1 ring-inset ring-zinc-200/70',
        dropActive ? 'drop-active' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">
          Term {term}
        </div>
        <div className="text-[10.5px] font-mono text-zinc-400">
          {instances.length} · {totalUoc} UoC
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {instances.map((inst) => {
          const course = getCourse(inst.code);
          const status = getStatus(inst);
          const missing = getMissing(inst);
          return (
            <div key={inst.id} onMouseDown={(e) => onDragStart(e, inst.id, termKey)}>
              <CourseCard
                course={course}
                status={status}
                prereqsMissing={missing}
                isDragging={dragInstanceId === inst.id}
                onRemove={() => onRemove && onRemove(inst.id, termKey)}
                onSetStatus={(s) => onSetStatus && onSetStatus(inst.id, termKey, s)}
              />
            </div>
          );
        })}

        {isEmpty && (
          <div className="rounded-[8px] border border-dashed border-zinc-300 text-zinc-400 text-[12px] py-5 text-center">
            Empty
          </div>
        )}
      </div>

      <button
        onClick={() => onAddClick && onAddClick(termKey)}
        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md py-1.5 transition-colors"
      >
        <IconPlus size={12} />
        <span>Add course</span>
      </button>
    </div>
  );
}

// ---------- Year Row ----------
export function YearRow({ year, collapsed, onToggle, courseCount, totalUoc, children }) {
  return (
    <div className="rounded-[12px] bg-white border border-zinc-200/80 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={[
              'text-zinc-500 transition-transform duration-150',
              collapsed ? '-rotate-90' : '',
            ].join(' ')}
          >
            <IconChevron size={16} />
          </span>
          <div className="text-[13.5px] font-semibold text-zinc-900">{year.label}</div>
          <div className="text-[11.5px] font-mono text-zinc-400">{year.year}</div>
        </div>
        <div className="flex items-center gap-4 text-[11.5px] text-zinc-500">
          <span>
            <span className="font-mono text-zinc-700">{courseCount}</span> courses
          </span>
          <span>
            <span className="font-mono text-zinc-700">{totalUoc}</span> UoC
          </span>
        </div>
      </button>
      <div
        style={{
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          display: 'grid',
          transition: 'grid-template-rows 240ms ease',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Chat bubbles ----------
export function AIMessage({ children }) {
  return (
    <div className="msg-enter flex items-start gap-2.5 max-w-[92%]">
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-white grid place-items-center">
        <IconLogo size={14} />
      </div>
      <div className="text-[13.5px] leading-[1.55] text-zinc-800 pt-1">{children}</div>
    </div>
  );
}

export function UserMessage({ children }) {
  return (
    <div className="msg-enter flex justify-end">
      <div className="text-[13.5px] leading-[1.5] text-zinc-900 bg-zinc-100 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[80%]">
        {children}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="msg-enter flex items-center gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-white grid place-items-center">
        <IconLogo size={14} />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-100 rounded-full">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
      </div>
    </div>
  );
}

export function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={['inline-block w-2 h-2 rounded-sm', swatch].join(' ')}></span>
      <span>{label}</span>
    </div>
  );
}

// ---------- Add Course Modal ----------
export function AddCourseModal({ onClose, onSubmit }) {
  const [step, setStep] = useState('choice');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [uoc, setUoc] = useState(6);
  const [status, setStatus] = useState('ready');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      code: code.trim(),
      uoc: Number(uoc),
      status,
    });
  };

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-[14px] shadow-xl w-[380px] p-6 card-enter"
      >
        {step === 'choice' ? (
          <>
            <div className="text-[15px] font-semibold tracking-tight text-zinc-900">
              Add a course
            </div>
            <div className="text-[12.5px] text-zinc-500 mt-1">
              Pick how you'd like to add this course.
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                disabled
                className="text-left rounded-[10px] border border-zinc-200 px-4 py-3 opacity-40 cursor-not-allowed"
              >
                <div className="text-[13.5px] font-medium text-zinc-900">
                  Add existing class
                </div>
                <div className="text-[11.5px] text-zinc-500 mt-0.5">Coming soon</div>
              </button>
              <button
                onClick={() => setStep('form')}
                className="text-left rounded-[10px] border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 px-4 py-3 transition-colors"
              >
                <div className="text-[13.5px] font-medium text-zinc-900">
                  Create my own class
                </div>
                <div className="text-[11.5px] text-zinc-500 mt-0.5">
                  Customise name, code, UoC and status
                </div>
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="text-[12.5px] text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[15px] font-semibold tracking-tight text-zinc-900">
              Create a custom course
            </div>
            <div className="text-[12.5px] text-zinc-500 mt-1">
              All fields apply to this card only.
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                  Course name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quantum Computing"
                  className="text-[13.5px] bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-400 outline-none rounded-[10px] px-3 py-2 transition-colors placeholder:text-zinc-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                  Course code <span className="text-zinc-400 normal-case">(optional)</span>
                </span>
                <input
                  type="text"
                  value={code}
                  maxLength={10}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PHYS3050"
                  className="font-mono text-[12.5px] bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-400 outline-none rounded-[10px] px-3 py-2 transition-colors placeholder:text-zinc-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                    UoC
                  </span>
                  <select
                    value={uoc}
                    onChange={(e) => setUoc(Number(e.target.value))}
                    className="text-[13.5px] bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-400 outline-none rounded-[10px] px-3 py-2 transition-colors"
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="text-[13.5px] bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-400 outline-none rounded-[10px] px-3 py-2 transition-colors"
                  >
                    <option value="ready">Ready</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-[12.5px] text-zinc-700 border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-md px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!name.trim()}
                className="text-[12.5px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Add course
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
