import type { FormValues } from "../index";
import type { ExternalTransferRequest } from "../../../types/communication";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import {
  type EthereumNetworkFee,
  type PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/keyring";
import ToAddressAutocomplete from "./ToAddressAutocomplete";
import AmountFeeInputs, { type AmountStatus } from "./AmountFeeInputs";

const showRpcSelector = false;

interface TransferFormProps {
  request?: ExternalTransferRequest;
  getFee?: () => void;
  networkFee: PocketNetworkFee | EthereumNetworkFee;
  feeStatus?: AmountStatus;
}

const TransferForm: React.FC<TransferFormProps> = ({
  request,
  networkFee,
  feeStatus,
  getFee,
}) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();
  const protocol = watch("protocol");

  const isEth = SupportedProtocols.Ethereum === protocol;

  return (
    <Stack width={1} overflow={"hidden"}>
      <Stack
        width={360}
        paddingX={1}
        borderRadius={"4px"}
        boxSizing={"border-box"}
        bgcolor={theme.customColors.dark2}
        marginTop={showRpcSelector ? 0.5 : 2}
        paddingTop={!showRpcSelector ? (isEth ? 2.5 : 2) : 1.5}
        paddingBottom={!showRpcSelector ? 2.5 : 1.2}
        border={`1px solid ${theme.customColors.dark15}`}
        spacing={2}
      >
        <AmountFeeInputs
          networkFee={networkFee}
          getFee={getFee}
          feeStatus={feeStatus}
          requestAmount={request?.amount}
        />
        {/*{(showRpcSelector || true) && <NetworkAutocomplete />}*/}
        <ToAddressAutocomplete disabled={!!request?.toAddress} />
        {protocol === SupportedProtocols.Pocket && (
          <Controller
            control={control}
            name={"memo"}
            render={({ field }) => (
              <TextField
                label={"Memo"}
                fullWidth
                autoComplete={"off"}
                size={"small"}
                disabled={!!request?.memo}
                {...field}
                sx={{
                  order: 8,
                  marginTop: "20px!important",
                }}
              />
            )}
          />
        )}
      </Stack>
    </Stack>
  );
};

export default TransferForm;
