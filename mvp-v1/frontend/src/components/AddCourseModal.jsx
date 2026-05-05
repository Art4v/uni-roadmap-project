import { useState, useEffect } from 'react';

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
