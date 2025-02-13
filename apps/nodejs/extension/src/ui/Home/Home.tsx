import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import { shallowEqual } from "react-redux";
import { AccountType } from "@soothe/vault";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";
import { selectedProtocolSelector } from "../../redux/selectors/network";
import SelectedAccount from "./SelectedAccount";
import AccountActions from "./AccountActions";
import PriceFooter from "./PriceFooter";
import NoAccounts from "./NoAccounts";
import {
  accountsSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";

export default function Home() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);

  useEffect(() => {
    if (!selectedAccount) {
      const accountOfNetwork = accounts.find(
        (item) =>
          item.protocol === selectedProtocol &&
          item.accountType !== AccountType.HDSeed
      );
      if (accountOfNetwork) {
        dispatch(
          changeSelectedAccountOfNetwork({
            protocol: selectedProtocol,
            address: accountOfNetwork.address,
          })
        );
      }
    }
  }, [selectedAccount?.address, selectedProtocol]);

  return (
    <Stack flexGrow={1} width={1}>
      {!selectedAccount ? (
        <NoAccounts />
      ) : (
        <>
          <SelectedAccount />
          <AccountActions />
          <PriceFooter />
        </>
      )}
    </Stack>
  );
}
