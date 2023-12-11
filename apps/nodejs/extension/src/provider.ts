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
  name: process.env.PROVIDER_INFO_NAME || "Soothe Wallet",
  icon:
    process.env.PROVIDER_INFO_ICON ||
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xNV8yNSkiPgo8cmVjdCB4PSIxMzIuNzQxIiB5PSIxMzIuNzQxIiB3aWR0aD0iMjQ2LjUxOSIgaGVpZ2h0PSIyNDYuNTE5IiBmaWxsPSIjRDlEOUQ5Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjU2IC0wLjYzMTgzNkw0NzggNzcuMDY4MlYyNTZDNDc4IDM0Ny42MiA0MjEuNzQ1IDQxMS42NjcgMzY5LjMwOSA0NTEuNDI3QzMyMy4zMTUgNDg1Ljk3OCAyNTYgNTEyLjYzMiAyNTYgNTEyLjYzMkMyNTYgNTEyLjYzMiAxODcuMTI1IDQ4NS4xMDQgMTQyLjY2OSA0NTEuNDA1QzkwLjI3NyA0MTEuNjg5IDM0IDM0Ny42NDIgMzQgMjU2LjAyMlY3Ny4wNjgyTDI1NiAtMC42MzE4MzZaTTE3MC41MjUgMTgzLjYwNUgzNDEuNDMxQzM1NS41NDcgMTgzLjYwNSAzNjcgMTcyLjIwMSAzNjcgMTU4LjA5QzM2NyAxNDMuOTc5IDM1NS41NDcgMTMyLjU3NSAzNDEuNDc1IDEzMi41NzVIMTcwLjUyNUMxNTYuNDA5IDEzMi41NzUgMTQ1IDE0My45NzkgMTQ1IDE1OC4wOUMxNDUgMTcyLjIwMSAxNTYuNDUzIDE4My42MDUgMTcwLjUyNSAxODMuNjA1Wk0xNzAuNTI1IDM1NC41NzVIMzIxLjAxMUMzMzIuMTUzIDM1NC41NzUgMzQyLjg5NiAzNTAuOTgxIDM1MS4yNDEgMzQ0LjM3QzM2MS4yMjkgMzM2LjUxNSAzNjYuOTU2IDMyNS4wNjcgMzY2Ljk1NiAzMTIuOTUzVjI1OC45MDZDMzY2Ljk1NiAyNDYuNzkzIDM2MS4yMjkgMjM1LjM0NCAzNTEuMjQxIDIyNy40OUMzNDIuODk2IDIyMC45MjMgMzMyLjE1MyAyMTcuMzI5IDMyMS4wMTEgMjE3LjMyOUgxNzAuNTI1QzE1Ni40MDkgMjE3LjMyOSAxNDUgMjI4LjczMyAxNDUgMjQyLjg0M0MxNDUgMjU2Ljk1NCAxNTYuNDUzIDI2OC4zNTggMTcwLjUyNSAyNjguMzU4SDI5OC41OTNDMjk4LjU5MyAyNjguMzU4IDMxNi44ODIgMjY2Ljg5NCAzMTYuODgyIDI4NS4zMDlDMzE2Ljg4MiAzMDQuMTY3IDI5OC41OTMgMzAzLjU0NiAyOTguNTkzIDMwMy41NDZIMTcwLjUyNUMxNTYuNDA5IDMwMy41NDYgMTQ1IDMxNC45NSAxNDUgMzI5LjA2MUMxNDUgMzQzLjE3MSAxNTYuNDUzIDM1NC41NzUgMTcwLjUyNSAzNTQuNTc1WiIgZmlsbD0iIzE1MkE0OCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzE1XzI1Ij4KPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==`,
  rdns: process.env.PROVIDER_INFO_RDNS || "io.trustsoothe",
};

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

    window.dispatchEvent(
      new CustomEvent(announceType, {
        detail,
      })
    );
  };

  announce();
  window.addEventListener(requestType, announce);
};

const pocketProvider = new PocketNetworkProvider();
window.pocketNetwork = pocketProvider;

initAnnounceProvider({
  requestType: PocketRequestType,
  announceType: PocketAnnounceType,
  provider: pocketProvider,
});

const ethProvider = new EthereumProvider();
window.ethereum = ethProvider;

initAnnounceProvider({
  requestType: EIP6963EthRequestType,
  announceType: EIP6963EthAnnounceType,
  provider: ethProvider,
});
