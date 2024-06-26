import React from "react";
import {
  PocketNetworkFee,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  WPOKTBridge,
} from "@poktscan/vault";
import Summary from "./Summary";
import Submitted from "./Submitted";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import SendFormPokt from "./SendFormPokt";
import BaseTransaction from "./BaseTransaction";
import { useAppSelector } from "../../hooks/redux";
import { assetsSelector } from "../../redux/selectors/asset";

interface SendPoktProps {
  onCancel: () => void;
  isWrapping?: boolean;
}

export default function SendPokt({ onCancel, isWrapping }: SendPoktProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const assets = useAppSelector(assetsSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getTransaction={(data) => {
        const accountId = accounts.find(
          (item) =>
            item.address === data.fromAddress && item.protocol === data.protocol
        )?.id;

        let bridgeResult: ReturnType<
          typeof WPOKTBridge.createBridgeTransaction
        >;

        if (isWrapping) {
          const toAsset = assets.find(
            (asset) =>
              asset.protocol === SupportedProtocols.Ethereum &&
              asset.chainId === (data.chainId === "mainnet" ? "1" : "5")
          );

          bridgeResult = WPOKTBridge.createBridgeTransaction({
            from: data.fromAddress,
            amount: data.amount,
            chainID: data.chainId,
            ethereumAddress: data.recipientAddress,
            vaultAddress: toAsset.vaultAddress,
          });
        }

        return {
          from: {
            type: SupportedTransferOrigins.VaultAccountId,
            passphrase: data.vaultPassword || "",
            value: accountId,
          },
          network: {
            protocol: data.protocol,
            chainID: data.chainId,
          },
          to: {
            type: SupportedTransferDestinations.RawAddress,
            value: bridgeResult?.to || data.recipientAddress,
          },
          amount: Number(data.amount),
          transactionParams: {
            fee: (data.fee as PocketNetworkFee).value,
            memo: bridgeResult?.memo || data.memo || undefined,
          },
        };
      }}
      defaultFormValue={{
        memo: "",
        recipientProtocol: isWrapping ? SupportedProtocols.Ethereum : undefined,
      }}
      form={<SendFormPokt isWrapping={isWrapping} />}
      summary={<Summary isSwapping={isWrapping} />}
      success={<Submitted isSwapping={isWrapping} />}
      onCancel={onCancel}
      onDone={onCancel}
    />
  );
}
