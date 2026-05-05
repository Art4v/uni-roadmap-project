import { useState, useEffect, useRef, useCallback } from 'react';
import {
  COURSE_CATALOG,
  PREREQS,
  YEAR1_HISTORY,
  PATHWAYS,
  YEARS,
  TERMS,
  termId,
  termOrdinal,
} from './data.js';
import { IconLogo, IconSend } from './icons.jsx';
import {
  CourseCard,
  TermCell,
  YearRow,
  AIMessage,
  UserMessage,
  TypingBubble,
  Legend,
} from './components.jsx';

let __idSeq = 1;
const newId = () => `c${__idSeq++}`;

const CHAT_MIN_WIDTH = 320;
const CHAT_MAX_WIDTH = 720;
const CHAT_DEFAULT_WIDTH = 460;
const clampChatWidth = (w) => Math.min(CHAT_MAX_WIDTH, Math.max(CHAT_MIN_WIDTH, w));

// Build initial board state from Year 1 history only.
function buildInitial() {
  const board = {};
  YEARS.forEach((y) =>
    TERMS.forEach((t) => {
      board[termId(y.id, t)] = [];
    })
  );
  Object.entries(YEAR1_HISTORY).forEach(([key, list]) => {
    board[key] = list.map((c) => ({
      id: newId(),
      code: c.code,
      status: c.status,
      recommended: false,
    }));
  });
  return board;
}

// Recompute statuses across the board. Preserves completed/in-progress and recommended flag.
function recomputeStatuses(board) {
  const next = {};
  for (const k of Object.keys(board)) next[k] = board[k].slice();

  const ord = {};
  for (const y of YEARS)
    for (const t of TERMS) {
      for (const inst of next[termId(y.id, t)]) {
        const o = termOrdinal(y.id, t);
        ord[inst.code] = ord[inst.code] === undefined ? o : Math.min(ord[inst.code], o);
      }
    }

  for (const y of YEARS)
    for (const t of TERMS) {
      const key = termId(y.id, t);
      const myOrd = termOrdinal(y.id, t);
      next[key] = next[key].map((inst) => {
        if (inst.status === 'completed' || inst.status === 'in-progress') return inst;
        const reqs = PREREQS[inst.code] || [];
        const missing = reqs.filter((r) => {
          const rOrd = ord[r];
          return rOrd === undefined || rOrd >= myOrd;
        });
        if (missing.length > 0) return { ...inst, status: 'blocked', _missing: missing };
        return {
          ...inst,
          status: inst.recommended ? 'ai-recommended' : 'ready',
          _missing: [],
        };
      });
    }
  return next;
}

// Apply a pathway: keep Y1, replace Y2-Y4 with the plan as ai-recommended.
function applyPathway(board, pathwayKey) {
  const plan = PATHWAYS[pathwayKey].plan;
  const next = {};
  for (const y of YEARS)
    for (const t of TERMS) {
      const key = termId(y.id, t);
      if (y.id === 1) {
        next[key] = board[key].slice();
      } else {
        const codes = plan[key] || [];
        next[key] = codes.map((code) => ({
          id: newId(),
          code,
          status: 'ai-recommended',
          recommended: true,
        }));
      }
    }
  return recomputeStatuses(next);
}

export default function App() {
  // ----- Board state -----
  const [board, setBoard] = useState(() => recomputeStatuses(buildInitial()));
  const [collapsed, setCollapsed] = useState({});
  const [pathway, setPathway] = useState(null);

  // ----- Chat state -----
  const [messages, setMessages] = useState([]);
  const [chips, setChips] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const scrollerRef = useRef(null);

  const pushMsg = (role, text) =>
    setMessages((m) => [...m, { id: newId(), role, text }]);

  // Auto-scroll chat
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Boot: greet
  useEffect(() => {
    let cancel = false;
    let typingTimer;
    const greetTimer = setTimeout(() => {
      if (cancel) return;
      setTyping(true);
      typingTimer = setTimeout(() => {
        if (cancel) return;
        setTyping(false);
        pushMsg(
          'ai',
          "Hey! I'm here to help map out your UNSW journey. What kind of work do you want to do after graduating?"
        );
        setChips([
          { key: 'ai-ml', label: 'AI/ML researcher' },
          { key: 'swe', label: 'Software engineer' },
          { key: 'data', label: 'Data scientist' },
          { key: 'cyber', label: 'Cybersecurity' },
        ]);
      }, 900);
    }, 600);
    return () => {
      cancel = true;
      clearTimeout(greetTimer);
      clearTimeout(typingTimer);
    };
  }, []);

  const choosePathway = useCallback((key, fromTyped) => {
    const def = PATHWAYS[key];
    if (!def) return;
    pushMsg('user', fromTyped || def.label);
    setChips([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMsg(
        'ai',
        `Got it — tailoring your roadmap for ${def.label}. I've recommended courses across your remaining terms and flagged anything blocked by prereqs. Drag cards between terms if you want to adjust.`
      );
      setBoard((b) => applyPathway(b, key));
      setPathway(key);
      setTimeout(() => {
        const all = [
          { key: 'ai-ml', label: 'Switch to AI/ML' },
          { key: 'swe', label: 'Switch to Software engineer' },
          { key: 'data', label: 'Switch to Data scientist' },
          { key: 'cyber', label: 'Switch to Cybersecurity' },
        ];
        setChips(all.filter((c) => c.key !== key));
      }, 600);
    }, 1200);
  }, []);

  const handleSend = () => {
    const v = input.trim();
    if (!v) return;
    setInput('');
    const lower = v.toLowerCase();
    let key = null;
    if (/(cyber|security|infosec)/.test(lower)) key = 'cyber';
    else if (/(ai|ml|machine|deep|learning|research)/.test(lower)) key = 'ai-ml';
    else if (/(data|analyt)/.test(lower)) key = 'data';
    else if (/(software|engineer|swe|backend|frontend|fullstack)/.test(lower)) key = 'swe';
    if (key) {
      choosePathway(key, v);
    } else {
      pushMsg('user', v);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushMsg(
          'ai',
          "I've got curated plans for AI/ML, software engineering, data science and cybersecurity right now — pick one and I'll wire up the next three years."
        );
      }, 900);
    }
  };

  // ----- Chat sidebar resize -----
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);

  const onResizerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setResizing(true);
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const move = (e) => setChatWidth(clampChatWidth(e.clientX));
    const up = () => setResizing(false);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing]);

  // ----- Drag & drop (custom, simple, smooth) -----
  const cellRefs = useRef({});
  const registerRef = useCallback((key, el) => {
    if (el) cellRefs.current[key] = el;
  }, []);

  const [drag, setDrag] = useState(null);

  const onDragStart = useCallback(
    (e, instId, fromKey) => {
      if (e.button !== 0) return;
      const inst = (board[fromKey] || []).find((i) => i.id === instId);
      if (!inst) return;
      if (inst.status === 'completed') return;
      e.preventDefault();
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      setDrag({
        instId,
        fromKey,
        code: inst.code,
        x: e.clientX,
        y: e.clientY,
        w: rect.width,
        h: rect.height,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        overKey: fromKey,
      });
    },
    [board]
  );

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      let overKey = null;
      for (const [key, el] of Object.entries(cellRefs.current)) {
        const r = el.getBoundingClientRect();
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          overKey = key;
          break;
        }
      }
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, overKey } : d));
    };
    const up = () => {
      setDrag((d) => {
        if (!d) return null;
        if (d.overKey && d.overKey !== d.fromKey) {
          setBoard((b) => {
            const next = {};
            for (const k of Object.keys(b)) next[k] = b[k].slice();
            const idx = next[d.fromKey].findIndex((i) => i.id === d.instId);
            if (idx >= 0) {
              const [moved] = next[d.fromKey].splice(idx, 1);
              next[d.overKey].push(moved);
            }
            return recomputeStatuses(next);
          });
        }
        return null;
      });
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [drag]);

  // ----- Derived -----
  const getCourse = (code) => COURSE_CATALOG[code] || { code, title: code, uoc: 6 };
  const getStatus = (inst) => inst.status;
  const getMissing = (inst) => inst._missing || [];

  // ----- Render -----
  return (
    <div className="h-full flex flex-col bg-zinc-50 text-zinc-900">
      {/* Top bar */}
      <header className="h-12 shrink-0 border-b border-zinc-200 bg-white/80 backdrop-blur-sm flex items-center px-5 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white grid place-items-center">
            <IconLogo size={14} />
          </div>
          <div className="text-[14px] font-semibold tracking-tight">Pathway</div>
          <div className="text-[11.5px] text-zinc-400 font-mono ml-1">
            UNSW · CS Honours
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {pathway && (
            <div className="text-[11.5px] text-zinc-500">
              Current track:{' '}
              <span className="text-zinc-900 font-medium">{PATHWAYS[pathway].label}</span>
            </div>
          )}
          <div className="w-7 h-7 rounded-full bg-zinc-200 grid place-items-center text-[11px] font-semibold text-zinc-700">
            JS
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        {/* Left pane — chat */}
        <aside
          style={{ width: chatWidth }}
          className="shrink-0 bg-white flex flex-col"
        >
          <div className="h-14 shrink-0 px-5 flex items-center gap-3 border-b border-zinc-100">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-white grid place-items-center">
                <IconLogo size={16} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold text-zinc-900 leading-tight">
                Pathway Assistant
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 mt-0.5">
                <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot"></span>
                Online · personalising your plan
              </div>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 min-h-0 overflow-y-auto scroll-thin px-5 py-5 space-y-4"
          >
            {messages.map((m) =>
              m.role === 'ai' ? (
                <AIMessage key={m.id}>{m.text}</AIMessage>
              ) : (
                <UserMessage key={m.id}>{m.text}</UserMessage>
              )
            )}
            {typing && <TypingBubble />}
          </div>

          {/* Suggested chips */}
          {chips.length > 0 && (
            <div className="px-5 pb-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => choosePathway(c.key)}
                  className="text-[12px] text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-full px-3 py-1 transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-zinc-100">
            <div className="flex items-center gap-2 rounded-[10px] border border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-zinc-400 transition-colors px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Tell me about your career goals…"
                className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-zinc-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-md bg-zinc-900 text-white grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                <IconSend size={13} />
              </button>
            </div>
            <div className="mt-2 text-[10.5px] text-zinc-400 text-center font-mono">
              Pathway is a curated demo · UNSW CS catalog
            </div>
          </div>
        </aside>

        {/* Resizer */}
        <div
          onMouseDown={onResizerDown}
          role="separator"
          aria-orientation="vertical"
          className="relative shrink-0 w-px bg-zinc-200 cursor-col-resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right pane — board */}
        <main className="flex-1 min-w-0 overflow-y-auto scroll-thin">
          <div className="px-6 py-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[18px] font-semibold tracking-tight">Roadmap</div>
                <div className="text-[12.5px] text-zinc-500 mt-0.5">
                  {pathway
                    ? PATHWAYS[pathway].blurb
                    : 'Pick a career direction in the chat to populate your remaining terms.'}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11.5px] text-zinc-500">
                <Legend swatch="bg-emerald-500" label="Completed" />
                <Legend swatch="bg-blue-500" label="In progress" />
                <Legend swatch="bg-zinc-300" label="Ready" />
                <Legend swatch="bg-amber-500" label="Blocked" />
                <Legend swatch="bg-indigo-500" label="Recommended" />
              </div>
            </div>

            <div className="space-y-3">
              {YEARS.map((y) => {
                const insts = TERMS.flatMap((t) => board[termId(y.id, t)] || []);
                const courseCount = insts.length;
                const totalUoc = courseCount * 6;
                const isCollapsed = !!collapsed[y.id];
                return (
                  <YearRow
                    key={y.id}
                    year={y}
                    collapsed={isCollapsed}
                    onToggle={() =>
                      setCollapsed((c) => ({ ...c, [y.id]: !c[y.id] }))
                    }
                    courseCount={courseCount}
                    totalUoc={totalUoc}
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {TERMS.map((t) => {
                        const key = termId(y.id, t);
                        return (
                          <TermCell
                            key={key}
                            termKey={key}
                            year={y.id}
                            term={t}
                            instances={board[key] || []}
                            registerRef={registerRef}
                            dropActive={
                              drag && drag.overKey === key && drag.fromKey !== key
                            }
                            getCourse={getCourse}
                            getStatus={getStatus}
                            getMissing={getMissing}
                            dragInstanceId={drag && drag.instId}
                            onDragStart={onDragStart}
                          />
                        );
                      })}
                    </div>
                  </YearRow>
                );
              })}
            </div>

            <div className="mt-6 mb-4 text-[11px] text-zinc-400 font-mono">
              Tip: drag a recommended card into a different term to see prereqs
              revalidate live.
            </div>
          </div>
        </main>
      </div>

      {/* Drag overlay */}
      {drag &&
        (() => {
          const inst = (board[drag.fromKey] || []).find((i) => i.id === drag.instId);
          if (!inst) return null;
          const course = getCourse(inst.code);
          return (
            <div
              style={{
                position: 'fixed',
                left: drag.x - drag.offsetX,
                top: drag.y - drag.offsetY,
                width: drag.w,
                pointerEvents: 'none',
                zIndex: 100,
              }}
            >
              <CourseCard
                course={course}
                status={inst.status}
                prereqsMissing={inst._missing || []}
                isOverlay={true}
              />
            </div>
          );
        })()}
    </div>
  );
}
