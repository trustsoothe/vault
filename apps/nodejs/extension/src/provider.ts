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
} from "./constants/communication";

type EIP696 = {
  announceType: typeof EIP6963EthAnnounceType;
  requestType: typeof EIP6963EthRequestType;
};

type Pocket = {
  announceType: typeof PocketAnnounceType;
  requestType: typeof PocketRequestType;
};

type InitAnnounceProviderArg = (EIP696 | Pocket) & {
  provider: IProvider;
};

const providerInfo: EIP6963ProviderInfo = {
  uuid: v4(),
  name: process.env.PROVIDER_INFO_NAME || "Soothe Vault",
  icon:
    process.env.PROVIDER_INFO_ICON ||
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDYiIGhlaWdodD0iNDYiIHZpZXdCb3g9IjAgMCA0NiA0NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0zMy4yMDUgMi4zODNDNDAuNzg1IDYuMTQ1IDQ2IDEzLjk2IDQ2IDIyLjk5NyA0NiAzNS43MDMgMzUuNzAyIDQ2IDIzIDQ2YTIzLjEgMjMuMSAwIDAgMS00LjU4NS0uNDU5bDE4LjI5Mi0xOC4yOTNjMi44NzctMi44NzcgMi44NzctNy41NjEgMC0xMC40NC0yLjg4LTIuODc4LTcuNTYzLTIuODc4LTEwLjQ0IDBsLS4wMzUuMDM0LS4yNjEuMjYyLS4yMTUuMjE1LS4xMjYuMTI2LS42MDguNjA3LS41NDUuNTQ2LS41OTkuNTk5LS40Mi40Mi0zLjAxNyAzLjAxNy0uMzA0LjMwNS0uMjYzLjI2Mi0uNDc3LjQ3Ny0uMDM1LjAzNS0yLjY0MiAyLjY0M2EyLjY0NiAyLjY0NiAwIDEgMS0zLjc0My0zLjc0MWwyMC4yMjYtMjAuMjN6TTIzIDBjMS44MTYgMCAzLjU4Mi4yMTcgNS4yNzguNjE1TDkuNjI4IDE5LjI2NmMtMi44NzcgMi44OC0yLjg3NyA3LjU2MSAwIDEwLjQ0YTcuMzYyIDcuMzYyIDAgMCAwIDUuMjIgMi4xNmMxLjg5IDAgMy43ODEtLjcyIDUuMjItMi4xNmwuMDExLS4wMS4yNDQtLjI0NS40NzUtLjQ3NS41OTEtLjU5LjU5LS41OTEuMjYtLjI2LjIxNi0uMjE2IDcuMTYtNy4xNmEyLjY0OCAyLjY0OCAwIDAgMSAzLjc0NCAzLjc0M2wtMTkuOTg3IDE5Ljk5QzUuNDc5IDQwLjI0NSAwIDMyLjI2NiAwIDIzLjAwMSAwIDEwLjI5OCAxMC4yOTggMCAyMyAweiIgZmlsbD0iIzM3MzlCOSIgZmlsbC1ydWxlPSJub256ZXJvIi8+Cjwvc3ZnPgo=`,
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
