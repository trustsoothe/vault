import React from "react";
import Stack from "@mui/material/Stack";
import { AccountType } from "@poktscan/vault";
import { accountsSelector } from "../../redux/selectors/account";
import { useAppSelector } from "../hooks/redux";
import NoAccounts from "../Home/NoAccounts";
import ListAccounts from "./List";

export default function ManageAccounts() {
  const accounts = useAppSelector(accountsSelector);

  const hasAccountsWithoutSeeds = accounts.some(
    (account) => account.accountType !== AccountType.HDSeed
  );
  return (
    <Stack flexGrow={1}>
      {hasAccountsWithoutSeeds ? <ListAccounts /> : <NoAccounts />}
    </Stack>
  );
}
