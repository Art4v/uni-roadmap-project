import { useState } from 'react';
import {
  IconCheck,
  IconDot,
  IconAlert,
  IconSparkle,
  IconChevron,
  IconPlus,
  IconLogo,
} from './icons.jsx';

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
}) {
  const meta = STATUS_META[status] || STATUS_META.ready;
  const [hover, setHover] = useState(false);

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
        {StatusIcon && (
          <div className={['shrink-0 mt-0.5', meta.iconColor].join(' ')}>
            <StatusIcon size={14} />
          </div>
        )}
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
}) {
  const isEmpty = instances.length === 0;
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
          {instances.length} · {instances.length * 6} UoC
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

      <button className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md py-1.5 transition-colors">
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
