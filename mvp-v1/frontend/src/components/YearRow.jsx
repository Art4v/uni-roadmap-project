import { IconChevron } from '../icons';

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
