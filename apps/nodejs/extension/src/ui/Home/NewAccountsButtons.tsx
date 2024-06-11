import type { StackProps } from "@mui/material/Stack";
import React from "react";
import NewEntitiesButtons from "../components/NewEntitiesButtons";
import { useAccountDialogs } from "../Header/context/AccountDialogs";

interface NewAccountsButtonsProps {
  containerProps?: StackProps;
}

export default function NewAccountsButtons({
  containerProps,
}: NewAccountsButtonsProps) {
  const { showImportAccount, showCreateAccount } = useAccountDialogs();

  return (
    <NewEntitiesButtons
      containerProps={containerProps}
      importProps={{
        onClick: showImportAccount,
      }}
      createProps={{
        onClick: showCreateAccount,
      }}
    />
  );
}
