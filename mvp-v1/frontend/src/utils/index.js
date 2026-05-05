import { YEAR1_HISTORY, PREREQS, PATHWAYS, TERMS } from '../data';

let __idSeq = 1;
export const newId = () => `c${__idSeq++}`;
export const getIdSeq = () => __idSeq;

export const clampChatWidth = (w) => Math.min(720, Math.max(320, w));

export function termId(year, term) {
  return `Y${year}T${term}`;
}

export function termOrdinal(year, term) {
  return year * 10 + term;
}

export function buildInitial(yearsArr) {
  const board = {};
  yearsArr.forEach((y) =>
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

export function recomputeStatuses(board, yearsArr) {
  const next = {};
  for (const k of Object.keys(board)) next[k] = board[k].slice();

  const ord = {};
  for (const y of yearsArr)
    for (const t of TERMS) {
      const list = next[termId(y.id, t)] || [];
      for (const inst of list) {
        const o = termOrdinal(y.id, t);
        ord[inst.code] = ord[inst.code] === undefined ? o : Math.min(ord[inst.code], o);
      }
    }

  for (const y of yearsArr)
    for (const t of TERMS) {
      const key = termId(y.id, t);
      const myOrd = termOrdinal(y.id, t);
      const list = next[key] || [];
      next[key] = list.map((inst) => {
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

export function applyPathway(board, pathwayKey, yearsArr) {
  const plan = PATHWAYS[pathwayKey].plan;
  const next = {};
  for (const y of yearsArr)
    for (const t of TERMS) {
      const key = termId(y.id, t);
      if (plan[key]) {
        next[key] = plan[key].map((code) => ({
          id: newId(),
          code,
          status: 'ai-recommended',
          recommended: true,
        }));
      } else {
        next[key] = (board[key] || []).slice();
      }
    }
  return recomputeStatuses(next, yearsArr);
}
