import type { VaultSlice } from "./index";
import type { RootState } from "../../store";
import type { InternalDisconnectRes } from "../../../types/communications/disconnect";
import { ActionReducerMapBuilder, createAsyncThunk } from "@reduxjs/toolkit";
import {
  ExternalAccessRequest,
  SerializedSession,
  Session,
  SupportedProtocols,
} from "@poktscan/keyring";
import browser from "webextension-polyfill";
import { DISCONNECT_RESPONSE } from "../../../constants/communication";
import { getVault } from "../../../utils";

type Builder = ActionReducerMapBuilder<VaultSlice>;

const ExtensionVaultInstance = getVault();

export interface AuthorizeExternalSessionParam {
  request: ExternalAccessRequest;
  protocol: SupportedProtocols;
}

export const authorizeExternalSession = createAsyncThunk<
  SerializedSession,
  AuthorizeExternalSessionParam
>("vault/AuthorizeExternalSession", async ({ request, protocol }) => {
  const session = await ExtensionVaultInstance.authorizeExternal(
    request,
    protocol
  );
  return session.serialize();
});

export const revokeAllExternalSessions = createAsyncThunk(
  "vault/revokeAllExternalSessions",
  async (_, context) => {
    const {
      vault: { vaultSession, sessions },
    } = context.getState() as RootState;

    const activeSessions = sessions
      .map((session) => Session.deserialize(session))
      .filter((session) => session.isValid() && !!session.origin?.value);

    for (const session of activeSessions) {
      const [tabsWithOrigin] = await Promise.all([
        browser.tabs.query({
          url: `${session.origin.value}/*`,
        }),
        ExtensionVaultInstance.revokeSession(vaultSession.id, session.id),
      ]);

      if (tabsWithOrigin.length) {
        const response: InternalDisconnectRes = {
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
            protocol: session.protocol,
          },
          error: null,
        };

        await Promise.allSettled(
          tabsWithOrigin.map((tab) =>
            browser.tabs.sendMessage(tab.id, response)
          )
        );
      }
    }

    const allSessions = await ExtensionVaultInstance.listSessions(
      vaultSession.id
    );

    return allSessions
      .filter((item) => item.isValid())
      .map((item) => item.serialize());
  }
);

export const revokeSession = createAsyncThunk<
  SerializedSession[],
  { sessionId: string; external: boolean }
>("vault/revokeSession", async ({ sessionId, external }, context) => {
  const {
    vault: { vaultSession, sessions: sessionsFromState },
  } = context.getState() as RootState;

  await ExtensionVaultInstance.revokeSession(
    external ? sessionId : vaultSession.id,
    sessionId
  );

  let revokedSession: SerializedSession;

  const sessions = sessionsFromState.filter((item) => {
    if (item.id === sessionId) {
      revokedSession = item;
    }
    return item.id !== sessionId;
  });

  if (revokedSession) {
    const origin = revokedSession.origin;

    if (origin) {
      const tabsWithOrigin = await browser.tabs.query({ url: `${origin}/*` });

      if (tabsWithOrigin.length) {
        const response: InternalDisconnectRes = {
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
            protocol: revokedSession.protocol,
          },
          error: null,
        };

        await Promise.allSettled(
          tabsWithOrigin.map((tab) =>
            browser.tabs.sendMessage(tab.id, response)
          )
        );
      }
    }
  }

  return sessions;
});

export const addSessionThunksToBuilder = (builder: Builder) => {
  builder.addCase(revokeAllExternalSessions.fulfilled, (state, action) => {
    state.sessions = action.payload;
  });

  builder.addCase(revokeSession.fulfilled, (state, action) => {
    state.sessions = action.payload;
  });

  builder.addCase(authorizeExternalSession.fulfilled, (state, action) => {
    state.sessions.push(action.payload);
  });
};
