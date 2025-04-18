import type {
  IProvider,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
} from "./types";
import { v4 } from "uuid";
import PocketNetworkProvider from "./controllers/providers/PocketNetwork";
import EthereumProvider from "./controllers/providers/Ethereum";
import {
  EIP6963EthAnnounceType,
  EIP6963EthRequestType,
  PocketAnnounceType,
  PocketRequestType,
  PocketShannonAnnounceType,
  PocketShannonRequestType,
} from "./constants/communication";
import PocketShannonProvider from "./controllers/providers/Shannon";

type EIP696 = {
  announceType: typeof EIP6963EthAnnounceType;
  requestType: typeof EIP6963EthRequestType;
};

type Pocket = {
  announceType: typeof PocketAnnounceType;
  requestType: typeof PocketRequestType;
};

type PocketShannon = {
  announceType: typeof PocketShannonAnnounceType;
  requestType: typeof PocketShannonRequestType;
};

type InitAnnounceProviderArg = (EIP696 | Pocket | PocketShannon) & {
  provider: IProvider;
};

const providerInfo: EIP6963ProviderInfo = {
  uuid: v4(),
  name: process.env.PROVIDER_INFO_NAME || "Soothe Vault",
  icon:
    process.env.PROVIDER_INFO_ICON ||
    `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNDZweCIgaGVpZ2h0PSI0NnB4IgogICAgIHZpZXdCb3g9IjAgMCA0NiA0NiIgdmVyc2lvbj0iMS4xIj4KICAgIDxnIGlkPSJzdXJmYWNlMSI+CiAgICAgICAgPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigxMDAlLDQwJSwxOS42MDc4NDMlKTtmaWxsLW9wYWNpdHk6MTsiCiAgICAgICAgICAgICAgZD0iTSAzMy4yMTQ4NDQgMi4zODY3MTkgQyAzMy4wNTA3ODEgMi4zMDQ2ODggMzIuODUxNTYyIDIuMzM5ODQ0IDMyLjcyMjY1NiAyLjQ2ODc1IEwgMjcuNjgzNTk0IDcuNTAzOTA2IEwgMTMuNTkzNzUgMjEuNTk3NjU2IEMgMTIuNjAxNTYyIDIyLjU4OTg0NCAxMi41MjczNDQgMjQuMjE4NzUgMTMuNSAyNS4yMjY1NjIgQyAxNC40OTIxODggMjYuMjU3ODEyIDE2LjEyODkwNiAyNi4yNjk1MzEgMTcuMTM2NzE5IDI1LjI2MTcxOSBMIDI1LjI2MTcxOSAxNy4xMzY3MTkgQyAyOC4yNDYwOTQgMTQuMTUyMzQ0IDMzLjA4NTkzOCAxNC4xNTIzNDQgMzYuMDcwMzEyIDE3LjEzNjcxOSBDIDM5LjA1NDY4OCAyMC4xMjEwOTQgMzkuMDU0Njg4IDI0Ljk1NzAzMSAzNi4wNzAzMTIgMjcuOTQ1MzEyIEwgMjEuOTE3OTY5IDQyLjA5Mzc1IEwgMTguNzUgNDUuMjYxNzE5IEMgMTguNjI4OTA2IDQ1LjM4NjcxOSAxOC42OTE0MDYgNDUuNTk3NjU2IDE4Ljg2MzI4MSA0NS42Mjg5MDYgQyAyMC4yMDMxMjUgNDUuODcxMDk0IDIxLjU4NTkzOCA0Ni4wMDM5MDYgMjMgNDYuMDAzOTA2IEMgMzUuNzAzMTI1IDQ2LjAwMzkwNiA0NiAzNS43MDcwMzEgNDYgMjMuMDAzOTA2IEMgNDYgMTMuOTY4NzUgNDAuNzkyOTY5IDYuMTU2MjUgMzMuMjE0ODQ0IDIuMzkwNjI1IFogTSAzMy4yMTQ4NDQgMi4zODY3MTkgIi8+CiAgICAgICAgPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOnJnYigxMDAlLDY2LjY2NjY2NyUsMC4zOTIxNTclKTtmaWxsLW9wYWNpdHk6MTsiCiAgICAgICAgICAgICAgZD0iTSAzMi40NjQ4NDQgMjAuNzM4MjgxIEMgMzEuNDcyNjU2IDE5Ljc0MjE4OCAyOS44NTkzNzUgMTkuNzQyMTg4IDI4Ljg2MzI4MSAyMC43MzgyODEgTCAyMC43MzgyODEgMjguODYzMjgxIEMgMTcuNzUzOTA2IDMxLjg0NzY1NiAxMi45MTQwNjIgMzEuODQ3NjU2IDkuOTI5Njg4IDI4Ljg2MzI4MSBDIDYuOTQ1MzEyIDI1Ljg3ODkwNiA2Ljk0NTMxMiAyMS4wNDI5NjkgOS45Mjk2ODggMTguMDU0Njg4IEwgMjQuMDgyMDMxIDMuOTA2MjUgTCAyNy4yNSAwLjczODI4MSBDIDI3LjM3MTA5NCAwLjYxMzI4MSAyNy4zMDg1OTQgMC40MDIzNDQgMjcuMTM2NzE5IDAuMzcxMDk0IEMgMjUuNzk2ODc1IDAuMTI4OTA2IDI0LjQxMDE1NiAwIDIzIDAgQyAxMC4yOTY4NzUgMCAwIDEwLjI5Njg3NSAwIDIzIEMgMCAzMi4wMzEyNSA1LjIwNzAzMSAzOS44NDc2NTYgMTIuNzg1MTU2IDQzLjYwOTM3NSBDIDEyLjk0OTIxOSA0My42OTE0MDYgMTMuMTQ4NDM4IDQzLjY1NjI1IDEzLjI3NzM0NCA0My41MjczNDQgTCAxOC4zMTY0MDYgMzguNDkyMTg4IEwgMzIuNDY0ODQ0IDI0LjMzOTg0NCBDIDMzLjQ2MDkzOCAyMy4zNDM3NSAzMy40NjA5MzggMjEuNzM0Mzc1IDMyLjQ2NDg0NCAyMC43MzgyODEgWiBNIDMyLjQ2NDg0NCAyMC43MzgyODEgIi8+CiAgICA8L2c+Cjwvc3ZnPgo=`,
  rdns: process.env.PROVIDER_INFO_RDNS || "io.trustsoothe",
};

const isFirefox = navigator.userAgent.includes("Firefox");

const initAnnounceProvider = ({
  announceType,
  requestType,
  provider,
}: InitAnnounceProviderArg) => {
  const announce = () => {
    const detail: EIP6963ProviderDetail = Object.freeze({
      info: providerInfo,
      provider,
    });

    let detailToReturn: EIP6963ProviderDetail;

    if (isFirefox) {
      // @ts-ignore
      detailToReturn = cloneInto(detail, window, {
        cloneFunctions: true,
      });
    } else {
      detailToReturn = detail;
    }

    window.dispatchEvent(
      new CustomEvent(announceType, {
        detail: detailToReturn,
      })
    );
  };

  announce();
  window.addEventListener(requestType, announce);
};

const pocketProvider = new PocketNetworkProvider();
if (isFirefox) {
  // @ts-ignore
  window.wrappedJSObject.pocketNetwork = cloneInto(pocketProvider, window, {
    cloneFunctions: true,
  });
} else {
  window.pocketNetwork = pocketProvider;
}

initAnnounceProvider({
  requestType: PocketRequestType,
  announceType: PocketAnnounceType,
  provider: pocketProvider,
});

const pocketShannonProvider = new PocketShannonProvider();
if (isFirefox) {
  // @ts-ignore
  window.wrappedJSObject.pocketShannon = cloneInto(
    pocketShannonProvider,
    window,
    {
      cloneFunctions: true,
    }
  );
} else {
  window.pocketShannon = pocketShannonProvider;
}

initAnnounceProvider({
  requestType: PocketShannonRequestType,
  announceType: PocketShannonAnnounceType,
  provider: pocketShannonProvider,
});

const ethProvider = new EthereumProvider();
if (isFirefox) {
  // @ts-ignore
  window.wrappedJSObject.ethereum = cloneInto(ethProvider, window, {
    cloneFunctions: true,
  });
} else {
  window.ethereum = ethProvider;
}

initAnnounceProvider({
  requestType: EIP6963EthRequestType,
  announceType: EIP6963EthAnnounceType,
  provider: ethProvider,
});
