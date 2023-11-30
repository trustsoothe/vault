import type { RootState } from "../store";

export const contactsSelector = (state: RootState) => state.app.contacts;
