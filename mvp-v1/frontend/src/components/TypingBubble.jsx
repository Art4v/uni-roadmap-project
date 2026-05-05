import { IconLogo } from '../icons';

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
