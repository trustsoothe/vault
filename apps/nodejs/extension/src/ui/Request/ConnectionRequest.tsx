import type { AppConnectionRequest } from "../../types/communications/connection";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import React, { useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import { AccountType, SerializedAccountReference } from "@poktscan/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import AccountSelectableItem from "../components/AccountSelectableItem";
import { accountsSelector } from "../../redux/selectors/account";
import DialogButtons from "../components/DialogButtons";
import { useAppSelector } from "../../hooks/redux";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";

export default function ConnectionRequest() {
  const connectionRequest: AppConnectionRequest = useLocation()?.state;
  const protocol = connectionRequest?.protocol;
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const lastAcceptedRef = useRef<boolean>(null);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const accounts = useAppSelector(accountsSelector);

  const selectableAccounts = accounts.filter(
    (account) =>
      account.protocol === protocol &&
      account.accountType !== AccountType.HDSeed
  );

  const isSomethingSelected = !!selectedAccounts.length;

  const toggleSelectAccount = (account: SerializedAccountReference) => {
    setSelectedAccounts((prevState) => {
      const alreadySelected = prevState.includes(account.address);
      return !alreadySelected
        ? [...prevState, account.address]
        : prevState.filter((item) => item !== account.address);
    });
  };

  const sendResponse = async (accepted: boolean) => {
    if (connectionRequest) {
      lastAcceptedRef.current = accepted;
      setStatus("loading");
      const result = await AppToBackground.answerConnection({
        accepted: accepted && !!selectedAccounts.length,
        request: connectionRequest,
        selectedAccounts,
        protocol: connectionRequest.protocol,
      });
      const isError = !!result.error;
      setStatus(isError ? "error" : "normal");

      if (!isError) {
        lastAcceptedRef.current = null;
      }
    }
  };

  if (!connectionRequest) {
    return null;
  }

  let content: React.ReactNode;

  switch (status) {
    case "normal":
      content = (
        <Stack bgcolor={themeColors.white} padding={2.4} flexGrow={1}>
          <Stack
            flexGrow={1}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            spacing={0.2}
            paddingRight={0.5}
          >
            {selectableAccounts.map((account) => (
              <AccountSelectableItem
                isSelected={selectedAccounts.includes(account.address)}
                onClickAccount={toggleSelectAccount}
                account={account}
              />
            ))}
          </Stack>
          <Typography fontSize={11} lineHeight={"16px"} marginTop={0.8}>
            You allow the site to see the account’s address, balance, and
            suggest transactions for you to approve.
          </Typography>
        </Stack>
      );
      break;
    case "loading":
      break;
    case "error":
      break;
  }

  return (
    <Stack flexGrow={1}>
      <RequestInfo
        title={"Grant Access"}
        description={
          "Select which accounts you want to grant access to this site."
        }
        origin={connectionRequest.origin}
      />
      {content}
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            children: "Connect",
            disabled: !isSomethingSelected,
            onClick: () => sendResponse(true),
          }}
          secondaryButtonProps={{
            children: "Cancel",
            onClick: () => sendResponse(false),
          }}
        />
      </Stack>
    </Stack>
  );
}
