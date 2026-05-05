export const CHAT_MIN_WIDTH = 320;
export const CHAT_MAX_WIDTH = 720;
export const CHAT_DEFAULT_WIDTH = 460;

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
