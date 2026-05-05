import { IconPlus } from '../icons';
import { CourseCard } from './CourseCard';

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
