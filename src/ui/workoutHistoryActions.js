// WORKOUT history page: client-side search and filter chips. Nothing is stored; both values live in state only.
//   state:   wHistQuery (string), wHistFilterKey ('all' | 'week' | 'last' | 'earlier')
//   actions: wHistSearch (input element, value = text; wire to the input or change event) | wHistFilter (data-key)
//   The caller re-renders after the action, as for every other action.

const KEYS = new Set(['all', 'week', 'last', 'earlier']);

export function createWorkoutHistoryActions({ state }) {
  return {
    wHistSearch: (el) => { state.wHistQuery = String(el?.value ?? '').slice(0, 80); },
    wHistFilter: (el) => {
      const k = el?.dataset?.key;
      state.wHistFilterKey = KEYS.has(k) ? k : 'all';
    },
  };
}
