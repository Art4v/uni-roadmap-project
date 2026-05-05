export function UserMessage({ children }) {
  return (
    <div className="msg-enter flex justify-end">
      <div className="text-[13.5px] leading-[1.5] text-zinc-900 bg-zinc-100 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[80%]">
        {children}
      </div>
    </div>
  );
}
