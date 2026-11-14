// Actions and the ticking clock for the practice timer (F12). app.js merges `actions` into its action
// table and passes in what it owns. Stopping saves an ordinary guitar entry, so streaks, records and
// the export all pick it up with no extra work.

import { newEntry, parseGuitar } from '../logic/entries.js';
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
        state.practice = startPractice(Date.now(), inputValue('pt-focus'));
        persist();
        begin();
      },
      practiceStop: async () => {
        const p = state.practice;
        if (p.startAt == null) return;
        const mins = practiceMinutes(elapsedSeconds(p, Date.now()));
        const r = parseGuitar({ minutes: mins, focus: p.focus, bpm: inputValue('pt-bpm') });
        if (r.error) { state.msg = r.error; return; } // timer keeps running so nothing is lost
        const e = newEntry('guitar', today(), r.data, Date.now());
        try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
        state.entries.push(e);
        state.practice = idlePractice();
        persist();
        end();
        state.msg = `Saved ${mins} min of guitar.`;
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
