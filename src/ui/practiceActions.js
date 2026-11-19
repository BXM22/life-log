// Actions and the ticking clock for the practice timer (Learn window). app.js merges `actions` into its
// action table and passes in what it owns. Stopping saves a `session` entry for the timer's area.

import { buildSession } from '../logic/sessions.js';
import { clock, elapsedSeconds, idlePractice, loadPractice, practiceMinutes, savePractice, startPractice } from '../logic/practiceTimer.js';

export function createPracticeActions({ state, saveEntries, saveFail, inputValue, today }) {
  state.practice = (() => { try { return loadPractice(localStorage); } catch { return idlePractice(); } })();
  let timer = 0;

  const persist = () => { try { savePractice(localStorage, state.practice); } catch { /* storage blocked */ } };
  const paint = () => {
    const el = document.getElementById('practice-time');
    if (el) el.textContent = clock(elapsedSeconds(state.practice, Date.now()));
  };
  const end = () => { clearInterval(timer); timer = 0; };
  const begin = () => { clearInterval(timer); timer = setInterval(() => (state.practice.startAt == null ? end() : paint()), 500); };

  return {
    actions: {
      practiceStart: () => {
        state.practice = startPractice(
          Date.now(),
          inputValue('learn-focus'),
          state.learn?.area || (state.areas || [])[0]?.name || 'Guitar',
          state.learn?.type || 'practice',
        );
        persist();
        begin();
      },
      practiceStop: async () => {
        const p = state.practice;
        if (p.startAt == null) return;
        const mins = practiceMinutes(elapsedSeconds(p, Date.now()));
        const area = (state.areas || []).find((a) => String(a.name).toLowerCase() === String(p.area).toLowerCase());
        const r = buildSession({ area: p.area, type: p.type, minutes: mins, metric: inputValue('pt-metric'), metricLabel: area?.metricLabel ?? '', focus: p.focus, notes: '' }, today(), Date.now());
        if (r.error) { state.msg = r.error; return; } // timer keeps running so nothing is lost
        try { await saveEntries([r.entry]); } catch (err) { state.msg = saveFail(err); return; }
        state.entries.push(r.entry);
        state.practice = idlePractice();
        persist();
        end();
        state.msg = r.message;
      },
      practiceDiscard: () => {
        if (!window.confirm('Discard this practice without logging it?')) return;
        state.practice = idlePractice();
        persist();
        end();
        state.msg = 'Practice discarded.';
      },
    },
    // At boot: pick up a timer that was left running.
    resume: () => { if (state.practice.startAt != null) begin(); },
  };
}
