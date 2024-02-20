import { RootState } from "../store";

export const sessionsMaxAgeSelector = (state: RootState) =>
  state.app.sessionsMaxAge;

export const requirePasswordForSensitiveOptsSelector = (state: RootState) =>
  state.app.requirePasswordForSensitiveOpts;
