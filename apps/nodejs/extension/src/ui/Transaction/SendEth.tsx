import React from "react";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import { selectedAccountAddressSelector } from "../../redux/selectors/account";
import { useAppSelector } from "../../hooks/redux";
import BaseTransaction from "./BaseTransaction";
import SendFormEth from "./SendFormEth";
import Summary from "./Summary";

interface SendEthProps {
  asset?: {
    contractAddress: string;
    decimals: number;
  };
}

export default function SendEth({ asset }: SendEthProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getTransaction={() => null}
      defaultFormValue={{
        txSpeed: "medium",
      }}
      form={<SendFormEth asset={asset} />}
      summary={<Summary />}
    />
  );
}
