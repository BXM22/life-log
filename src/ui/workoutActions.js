// Actions for the WORKOUT tab. app.js merges these into its action table, passing in the pieces
// it owns (state, saving, reading inputs, today's date) so this file has no globals.

import { newEntry } from '../logic/entries.js';
import { sessionById } from '../logic/template.js';
import { caliBlockFor } from '../logic/activities.js';
import { exerciseList, setsComplete } from '../logic/workoutPlan.js';
import { prCheck } from '../logic/progress.js';
import { activeSessionId, lastWorking, parseSet, setText } from '../logic/workout.js';
import { setDots } from '../logic/workoutPlan.js';
import { loadExtras, saveExtras, extrasFor, addExtra, updateExtra, toggleExtraDone, removeExtra } from '../logic/extras.js';

export function createWorkoutActions({ state, saveEntries, saveFail, inputValue, today, onWorkingSet }) {
  // Spontaneous exercises for today only (logic/extras.js); the template is never touched.
  state.wExtras = loadExtras(localStorage, today());
  state.wAdd = false;
  state.wXEdit = null; // name of the extra open in the edit sheet, or null when adding
  const extrasToday = () => extrasFor(state.wExtras, today());
  const readExtraForm = () => ({
    name: document.getElementById('xe-name')?.value,
    mode: document.getElementById('xe-mode')?.value,
    perSide: Boolean(document.getElementById('xe-side')?.checked),
    equipment: document.getElementById('xe-equip')?.value,
    target: document.getElementById('xe-target')?.value,
  });
  const commitExtras = (list, msg) => {
    state.wExtras = { day: today(), list };
    saveExtras(localStorage, state.wExtras);
    state.msg = msg;
  };

  const itemAt = (i) => {
    const day = today();
    const id = activeSessionId(state.wSession, day, state.planDays);
    return exerciseList(sessionById(id) ?? { id, exercises: [] }, extrasToday(), caliBlockFor(state.activities, day))[Number(i)];
  };
  // Put a value in the draft and the live input (the page copies input values into the draft before it re-renders).
  const setField = (i, key, value) => {
    state.wDraft = { ...state.wDraft, [i]: { ...state.wDraft?.[i], [key]: String(value) } };
    const box = typeof document !== 'undefined' ? document.getElementById(`${key}-${i}`) : null;
    if (box) box.value = String(value);
  };
  // After working sets are saved: rest timer, then move on when the target is reached (same as the last set).
  const afterWorking = (item, wasComplete, msg) => {
    if (onWorkingSet) onWorkingSet();
    const day = today();
    if (!wasComplete && setsComplete(item.ex, state.entries, day, state.wTrims)) {
      msg = `${item.ex.name} done. ${msg}`;
      state.plates = null;
      state.wMore = null;
      const n = exerciseList(sessionById(activeSessionId(state.wSession, day, state.planDays)) ?? { exercises: [] }, extrasToday(), caliBlockFor(state.activities, day)).length;
      state.wEx = item.i + 1 < n ? item.i + 1 : null;
    }
    return msg;
  };

  return {
    // Last time strip, Use chip: fill the logging card with the last working set.
    wUseLast: (el) => {
      const item = itemAt(el.dataset.i);
      if (!item) return;
      const last = lastWorking(state.entries, state.stats, item.ex.name);
      if (!last) return;
      const i = el.dataset.i;
      if (last.weight != null) setField(i, 'w', last.weight);
      if (item.ex.mode === 'timed') { if (last.seconds != null) setField(i, 's', last.seconds); } else if (last.reps != null) setField(i, 'r', last.reps);
      if (last.load && (item.kind === 'cali' || item.ex.equipment === 'calisthenics')) setField(i, 'ld', last.load);
    },
    // Rep chip: set the reps (or seconds) box.
    wRepChip: (el) => {
      const item = itemAt(el.dataset.i);
      if (item) setField(el.dataset.i, item.ex.mode === 'timed' ? 's' : 'r', el.dataset.v);
    },
    // Fill all as: log every remaining working set at the shown weight and reps, then act like the last set.
    wFillAll: async (el) => {
      const day = today();
      const item = itemAt(el.dataset.i);
      if (!item) return;
      const i = el.dataset.i;
      const dots = setDots(item.ex, state.entries, day, state.wTrims);
      const remaining = dots.total == null ? 0 : dots.total - dots.done;
      if (remaining <= 0) { state.msg = 'No sets left to fill.'; return; }
      const wasComplete = setsComplete(item.ex, state.entries, day, state.wTrims);
      const ex = item.kind === 'cali' ? { ...item.ex, equipment: 'calisthenics' } : item.ex;
      const read = (side) => parseSet(ex, { weight: inputValue(`w-${i}`), reps: inputValue(`r-${i}`), seconds: inputValue(`s-${i}`), side, load: inputValue(`ld-${i}`) });
      const sides = ex.perSide ? ['L', 'R'] : [undefined];
      const entries = [];
      let t = Date.now();
      for (let n = 0; n < remaining; n++) {
        for (const side of sides) {
          const r = read(side);
          if (r.error) { state.msg = r.error; return; }
          entries.push(newEntry('lift_set', day, { session: item.sessionKey, exercise: ex.name, kind: 'working', ...r.data }, t++));
        }
      }
      try { await saveEntries(entries); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(...entries);
      const last = entries.at(-1);
      state.pr = prCheck(state.entries, last, state.stats);
      state.msg = afterWorking(item, wasComplete, `${remaining} ${remaining === 1 ? 'set' : 'sets'} logged: ${setText(last.data)}.`);
      state.undo = { id: last.id, msg: state.msg, i: item.i };
    },

    addExtraOpen: () => { state.wAdd = true; state.wXEdit = null; state.msg = ''; },
    addExtraCancel: () => { state.wAdd = false; state.wSheet = null; state.wXEdit = null; state.msg = ''; },
    addExtraSave: () => {
      const id = activeSessionId(state.wSession, today(), state.planDays);
      const r = addExtra(extrasToday(), sessionById(id)?.exercises ?? [], readExtraForm());
      if (r.error) { state.msg = r.error; return; }
      state.wAdd = false;
      state.wSheet = null; // the Add for today sheet closes on a successful save
      state.exOpen[r.list[r.list.length - 1].name] = true;
      commitExtras(r.list, 'Added for today. Log your sets below.');
    },
    // Edit a spontaneous exercise: the Add sheet reopens filled in (state.wXEdit = its current name).
    editExtraOpen: (el) => { state.wXEdit = el.dataset.name; state.wMenu = null; state.wSheet = 'add'; state.wAdd = true; state.msg = ''; },
    editExtraSave: () => {
      const id = activeSessionId(state.wSession, today(), state.planDays);
      const r = updateExtra(extrasToday(), sessionById(id)?.exercises ?? [], state.wXEdit, readExtraForm());
      if (r.error) { state.msg = r.error; return; }
      state.wAdd = false; state.wSheet = null; state.wXEdit = null;
      commitExtras(r.list, 'Exercise updated.');
    },
    // Mark a spontaneous exercise done (or not done). Marking it done moves on to the next exercise.
    toggleExtraDone: (el) => {
      const list = extrasToday();
      const ex = list.find((e) => e.name === el.dataset.name);
      if (!ex) return;
      commitExtras(toggleExtraDone(list, ex.name), ex.done ? `${ex.name} marked not done.` : `${ex.name} done.`);
      state.wMenu = null;
      if (!ex.done && state.wEx != null) {
        const n = exerciseList(sessionById(activeSessionId(state.wSession, today(), state.planDays)) ?? { exercises: [] }, extrasToday(), caliBlockFor(state.activities, today())).length;
        state.plates = null;
        state.wEx = state.wEx + 1 < n ? state.wEx + 1 : null;
      }
    },
    removeExtra: (el) => commitExtras(removeExtra(extrasToday(), el.dataset.name), 'Removed from today. Sets you logged stay in your log.'),

    pickSession: (el) => { state.wSession = el.value; state.msg = ''; },

    toggleHistory: () => { state.wHistory = !state.wHistory; state.tEdit = null; state.msg = ''; },

    logSet: async (el) => {
      const day = today();
      const id = activeSessionId(state.wSession, day, state.planDays);
      const list = exerciseList(sessionById(id) ?? { id, exercises: [] }, extrasToday(), caliBlockFor(state.activities, day));
      const item = list[Number(el.dataset.i)];
      if (!item) return;
      const wasComplete = setsComplete(item.ex, state.entries, day, state.wTrims);
      // Calisthenics block exercises take the Added/Assisted weight like equipment 'calisthenics'.
      const ex = item.kind === 'cali' ? { ...item.ex, equipment: 'calisthenics' } : item.ex;
      const kind = el.dataset.kind === 'warmup' ? 'warmup' : 'working';
      const r = parseSet(ex, {
        weight: inputValue(`w-${el.dataset.i}`),
        reps: inputValue(`r-${el.dataset.i}`),
        seconds: inputValue(`s-${el.dataset.i}`),
        side: inputValue(`sd-${el.dataset.i}`),
        load: inputValue(`ld-${el.dataset.i}`),
      });
      if (r.error) { state.msg = r.error; return; }
      const e = newEntry('lift_set', day, { session: item.sessionKey, exercise: ex.name, kind, ...r.data }, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(e);
      // Per-side exercise: the Side box flips to the other side, ready for the next set.
      if (r.data.side) {
        const other = r.data.side === 'L' ? 'R' : 'L';
        state.wDraft = { ...state.wDraft, [el.dataset.i]: { ...state.wDraft?.[el.dataset.i], sd: other } };
        const box = document.getElementById(`sd-${el.dataset.i}`);
        if (box) box.value = other; // the page copies input values into the draft before it re-renders
      }
      state.pr = prCheck(state.entries, e, state.stats);
      state.msg = `${kind === 'warmup' ? 'Warm-up' : 'Set'} saved: ${setText(r.data)}.`;
      if (kind === 'working' && onWorkingSet) onWorkingSet();
      // Hit the target set count: move on to the next exercise (or back to the list after the last one).
      if (kind === 'working' && !wasComplete && setsComplete(item.ex, state.entries, day, state.wTrims)) {
        state.msg = `${item.ex.name} done. ${state.msg}`;
        state.plates = null;
        state.wMore = null;
        state.wEx = item.i + 1 < list.length ? item.i + 1 : null;
      }
      state.undo = { id: e.id, msg: state.msg, i: item.i }; // the toast offers UNDO while this message is showing
    },
  };
}
