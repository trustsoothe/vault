import { useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import { SupportedProtocols } from "@poktscan/vault";
import { useAppSelector } from "../../../hooks/redux";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../../redux/selectors/network";
import {
  assetsIdOfSelectedAccountSelector,
  assetsSelector,
} from "../../../redux/selectors/asset";

export default function useSelectedAsset() {
  const location = useLocation();
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const assetsIdOfAccount = useAppSelector(
    assetsIdOfSelectedAccountSelector,
    shallowEqual
  );
  const assets = useAppSelector(assetsSelector);

  const [searchParams] = useSearchParams();

  const assetId = searchParams.get("asset");

  return useMemo(() => {
    if (
      selectedProtocol !== SupportedProtocols.Ethereum ||
      location.pathname !== "/"
    )
      return null;

    return assets.find(
      (asset) =>
        asset.id === assetId &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain &&
        assetsIdOfAccount.includes(assetId)
    );
  }, [
    assetId,
    assetsIdOfAccount,
    selectedChain,
    selectedProtocol,
    location.pathname,
  ]);
}
