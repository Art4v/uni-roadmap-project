import { IconLogo } from '../icons';

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
