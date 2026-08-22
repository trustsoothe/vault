import type { RootState } from '../store'

export const updateAvailableSelector = (state: RootState) => {
  return state.app.updateVersion;
};

export const pendingOutgoingSelector = (state: RootState) =>
  state.app.pendingOutgoing;
