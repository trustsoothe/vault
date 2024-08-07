import { RootState } from "../../store";

export const transactionsSelector = (state: RootState) =>
  state.app.transactions;
