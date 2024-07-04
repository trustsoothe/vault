import React from "react";
import uniq from "lodash/uniq";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import {
  SerializedAccountReference,
  Session,
  SupportedProtocols,
} from "@poktscan/vault";
import {
  accountsSelector,
  selectedAccountByProtocolSelector,
} from "../../redux/selectors/account";
import { networksSelector } from "../../redux/selectors/network";
import Summary, { SummaryRowItem } from "../components/Summary";
import { labelByProtocolMap } from "../../constants/protocols";
import DialogButtons from "../components/DialogButtons";
import AccountInfo from "../components/AccountInfo";
import BaseDialog from "../components/BaseDialog";
import { useAppSelector } from "../hooks/redux";

interface ConnectionDetailModalProps {
  connection?: Session;
  open: boolean;
  onClose: () => void;
}

export default function ConnectionDetailModal({
  connection,
  open,
  onClose,
}: ConnectionDetailModalProps) {
  const selectedAccountByProtocol = useAppSelector(
    selectedAccountByProtocolSelector
  );
  const accounts = useAppSelector(accountsSelector);
  const networks = useAppSelector(networksSelector);
  const networkOfConnection = networks.find(
    (network) =>
      network.protocol === connection?.protocol &&
      network.chainId ===
        (connection?.protocol === SupportedProtocols.Pocket ? "mainnet" : "1")
  );
  const selectedAccountAddress =
    selectedAccountByProtocol[connection?.protocol];

  const addressesOfAccountsConnected = uniq(
    connection?.permissions
      ?.filter((item) => item.resource === "account")
      ?.reduce(
        (acc: string[], permission) => [...acc, ...permission.identities],
        []
      ) || []
  );

  let selectedAccount: SerializedAccountReference;
  const accountsConnected = accounts.filter((account) => {
    if (
      selectedAccountAddress === account.address &&
      connection?.protocol === account.protocol &&
      addressesOfAccountsConnected.includes(account.address)
    ) {
      selectedAccount = account;
      return false;
    }

    return (
      addressesOfAccountsConnected.includes(account.address) &&
      connection?.protocol === account.protocol
    );
  });

  if (selectedAccount) {
    accountsConnected.unshift(selectedAccount);
  }

  return (
    <BaseDialog open={open} onClose={onClose} title={"Connection Details"}>
      <DialogContent sx={{ padding: "24px!important" }}>
        <Summary
          rows={[
            {
              type: "row",
              label: "Protocol",
              value: (
                <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
                  <img
                    height={15}
                    width={15}
                    src={networkOfConnection?.iconUrl}
                    alt={`${networkOfConnection?.protocol}-icon`}
                  />
                  <Typography variant={"subtitle2"}>
                    {labelByProtocolMap[connection?.protocol] ||
                      connection?.protocol}
                  </Typography>
                </Stack>
              ),
            },
            {
              type: "divider",
            },
            {
              type: "row",
              label: "Site",
              value: connection?.origin?.value || "",
            },
          ]}
        />
        <Summary
          containerProps={{
            marginTop: 1.6,
          }}
          rows={
            accountsConnected
              .map((account, index) => [
                {
                  type: "row",
                  label: "Connected",
                  value: (
                    <AccountInfo
                      address={account.address}
                      name={account.name}
                    />
                  ),
                },
                ...(index !== accountsConnected.length - 1
                  ? [
                      {
                        type: "divider",
                      },
                    ]
                  : []),
              ])
              .reduce(
                (acc, item) => [...acc, ...item],
                []
              ) as Array<SummaryRowItem>
          }
        />
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 85 }}>
        <DialogButtons
          primaryButtonProps={{
            children: "Done",
            onClick: () => {
              onClose();
            },
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
