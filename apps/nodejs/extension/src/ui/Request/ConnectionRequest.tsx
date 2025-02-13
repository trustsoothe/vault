import type { AppConnectionRequest } from "../../types/communications/connection";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { AccountType, SerializedAccountReference } from "@soothe/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import AccountSelectableItem from "../components/AccountSelectableItem";
import { accountsSelector } from "../../redux/selectors/account";
import NewAccountModal from "../NewAccount/NewAccountModal";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "../hooks/redux";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";

export default function ConnectionRequest() {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const errorSnackbarKey = useRef<SnackbarKey>();
  const connectionRequest: AppConnectionRequest = useLocation()?.state;
  const protocol = connectionRequest?.protocol;
  const [status, setStatus] = useState<"normal" | "loading">("normal");
  const lastAcceptedRef = useRef<boolean>(null);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const accounts = useAppSelector(accountsSelector);

  const selectableAccounts = accounts.filter(
    (account) =>
      account.protocol === protocol &&
      account.accountType !== AccountType.HDSeed
  );

  const isSomethingSelected = !!selectedAccounts.length;

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  const toggleShowNewAccountModal = () => {
    setShowNewAccountModal((prevState) => !prevState);
  };

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

      if (result?.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: {
            title: "Failed to answer the request",
            content: `There was an error trying to ${
              accepted ? "accept" : "reject"
            } the connection request.`,
          },
          onRetry: () => sendResponse(accepted),
        });
      } else {
        closeSnackbars();
      }
      setStatus("normal");
    }
  };

  if (!connectionRequest) {
    return null;
  }

  const isLoading = status === "loading";

  return (
    <>
      <NewAccountModal
        open={showNewAccountModal}
        onClose={toggleShowNewAccountModal}
        protocol={protocol}
      />
      <Stack flexGrow={1}>
        <RequestInfo
          title={"Grant Access"}
          description={""}
          origin={connectionRequest.origin}
          paddingBottom={1.4}
          paddingTop={1}
        />
        <Stack bgcolor={themeColors.white} padding={2.4} flexGrow={1}>
          {selectableAccounts.length > 0 && (
            <Stack
              spacing={0.7}
              direction={"row"}
              alignItems={"center"}
              marginBottom={"10px!important"}
              paddingRight={2.7}
            >
              <Typography
                fontSize={11}
                lineHeight={"16px"}
                marginTop={0.8}
                color={themeColors.textSecondary}
              >
                Select the accounts you want to grant access to this site.
                <br />
                If you want to create a new account,{" "}
                <Typography
                  fontSize={11}
                  lineHeight={"16px"}
                  sx={{
                    color: themeColors.primary,
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                  component={"span"}
                  onClick={toggleShowNewAccountModal}
                >
                  click here
                </Typography>
              </Typography>
            </Stack>
          )}
          <Stack
            flexGrow={1}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            spacing={1}
            paddingRight={0.5}
          >
            {selectableAccounts.length > 0 ? (
              selectableAccounts.map((account) => (
                <AccountSelectableItem
                  backgroundColor={themeColors.bgLightGray}
                  border={`1px solid ${themeColors.borderLightGray}`}
                  isSelected={selectedAccounts.includes(account.address)}
                  onClickAccount={toggleSelectAccount}
                  account={account}
                  disabled={isLoading}
                />
              ))
            ) : (
              <Stack
                width={1}
                height={1}
                flexGrow={1}
                alignItems={"center"}
                justifyContent={"center"}
                paddingY={2.4}
              >
                <Button
                  color={"primary"}
                  variant={"contained"}
                  onClick={toggleShowNewAccountModal}
                >
                  Create New
                </Button>
                <Typography
                  fontSize={11}
                  lineHeight={"16px"}
                  marginTop={0.8}
                  color={themeColors.textSecondary}
                >
                  No accounts available. Create a new one.
                </Typography>
              </Stack>
            )}
          </Stack>
          <Typography fontSize={11} lineHeight={"16px"} marginTop={0.8}>
            You allow the site to see the account’s address, balance, and
            suggest transactions for you to approve.
          </Typography>
        </Stack>
        <Stack height={85}>
          <DialogButtons
            primaryButtonProps={{
              children: "Connect",
              disabled: !isSomethingSelected,
              onClick: () => sendResponse(true),
              isLoading,
            }}
            secondaryButtonProps={{
              children: "Cancel",
              disabled: isLoading,
              onClick: () => sendResponse(false),
            }}
          />
        </Stack>
      </Stack>
    </>
  );
}
