import React, { useMemo } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Account,
  AccountType,
  SerializedAccountReference,
} from "@poktscan/vault";
import BaseDialog from "../../components/BaseDialog";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../../redux/selectors/account";
import { themeColors } from "../../theme";
import AddAccountButton from "./AddAccountButton";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { selectedProtocolSelector } from "../../../redux/selectors/network";
import { changeSelectedAccountOfNetwork } from "../../../redux/slices/app";
import AccountSelectableItem from "../../components/AccountSelectableItem";

interface AccountSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountSelectModal({
  open,
  onClose,
}: AccountSelectModalProps) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(accountsSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectableAccounts = useMemo(() => {
    return accounts.filter(
      (account: Account) =>
        account.accountType !== AccountType.HDSeed &&
        account.protocol === selectedProtocol
    );
  }, [accounts, selectedProtocol]);

  const handleSelectAccount = (account: SerializedAccountReference) => {
    // todo: add snackbar when error occur
    dispatch(
      changeSelectedAccountOfNetwork({
        protocol: selectedProtocol,
        address: account.address,
      })
    );

    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={"Select Account"}
      TransitionProps={{
        timeout: { exit: 300 },
      }}
    >
      <DialogContent
        sx={{
          rowGap: 0.2,
          maxHeight: 246,
          display: "flex",
          flexDirection: "column",
          paddingX: "8px!important",
          paddingY: "16px!important",
          backgroundColor: themeColors.white,
        }}
      >
        {selectableAccounts.map((account) => (
          <AccountSelectableItem
            key={account.address}
            account={account}
            isSelected={selectedAccountAddress === account.address}
            onClickAccount={handleSelectAccount}
          />
        ))}
      </DialogContent>
      <DialogActions
        sx={{
          width: 1,
          rowGap: 2,
          padding: 2.4,
          display: "flex",
          boxSizing: "border-box",
          backgroundColor: themeColors.bgLightGray,
          borderTop: `1px solid ${themeColors.borderLightGray}`,
        }}
      >
        <AddAccountButton closeSelectModal={onClose} />
      </DialogActions>
    </BaseDialog>
  );
}
