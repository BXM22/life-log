// Open / close the Manage habits sheet. The scrim and X both use data-action="closeManageHabits".
export function createManageHabitsActions({ state }) {
  return {
    openManageHabits: () => { state.manageHabits = true; state.msg = ''; },
    closeManageHabits: () => { state.manageHabits = false; },
  };
}
