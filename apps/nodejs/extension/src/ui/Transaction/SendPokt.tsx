import React from "react";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import BaseTransaction from "./BaseTransaction";
import { useAppSelector } from "../../hooks/redux";
import { selectedAccountAddressSelector } from "../../redux/selectors/account";
import SendFormPokt from "./SendFormPokt";
import Summary from "./Summary";

export default function SendPokt() {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getTransaction={() => null}
      defaultFormValue={{}}
      form={<SendFormPokt />}
      summary={<Summary />}
    />
  );
}
