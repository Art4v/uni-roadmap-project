export function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={['inline-block w-2 h-2 rounded-sm', swatch].join(' ')}></span>
      <span>{label}</span>
    </div>
  );
}
