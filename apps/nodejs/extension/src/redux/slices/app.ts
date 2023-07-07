import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CONNECTION_REQUEST_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
} from "../../constants/communication";

export interface ConnectionRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  origin: string;
  faviconUrl: string;
  tabId: number;
}

export interface NewAccountRequest {
  type: typeof NEW_ACCOUNT_REQUEST;
  origin: string;
  faviconUrl: string;
  tabId: number;
}

export interface TransferRequest {
  type: typeof TRANSFER_REQUEST;
  origin: string;
  faviconUrl: string;
  tabId: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
}

export type RequestsType =
  | ConnectionRequest
  | NewAccountRequest
  | TransferRequest;

interface GeneralAppSlice {
  requestsWindowId: number | null;
  externalRequests: RequestsType[];
}

const initialState: GeneralAppSlice = {
  requestsWindowId: null,
  externalRequests: [],
};

const generalAppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    resetRequestsState: (state) => {
      state.externalRequests = [];
      state.requestsWindowId = null;
    },
    addExternalRequest: (state, action: PayloadAction<RequestsType>) => {
      state.externalRequests.push(action.payload);
    },
    addWindow: (state, action: PayloadAction<number>) => {
      state.requestsWindowId = action.payload;
    },
    removeExternalRequest: (
      state,
      action: PayloadAction<{ origin: string; type: string }>
    ) => {
      const { origin, type } = action.payload;

      state.externalRequests = state.externalRequests.filter(
        (request) => !(request.origin === origin && request.type === type)
      );
    },
  },
});

export const {
  resetRequestsState,
  removeExternalRequest,
  addExternalRequest,
  addWindow,
} = generalAppSlice.actions;

export default generalAppSlice.reducer;
