import type { RootState } from '../store'

export const updateAvailableSelector = (state: RootState) => {
  return state.app.updateVersion;
};
