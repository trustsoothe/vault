import type { FormValues } from "../index";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import ToAddressAutocomplete from "./ToAddressAutocomplete";
import AmountFeeInputs from "./AmountFeeInputs";
import { useTransferContext } from "../../../contexts/TransferContext";

const showRpcSelector = false;

const TransferForm: React.FC = () => {
  const theme = useTheme();
  const { control } = useFormContext<FormValues>();
  const { disableInputs, isPokt } = useTransferContext();

  return (
    <Stack width={1} overflow={"hidden"}>
      <Stack
        width={360}
        paddingX={1}
        borderRadius={"4px"}
        boxSizing={"border-box"}
        bgcolor={theme.customColors.dark2}
        marginTop={showRpcSelector ? 0.5 : 2}
        paddingTop={!showRpcSelector ? (!isPokt ? 2.5 : 2) : 1.5}
        paddingBottom={!showRpcSelector ? 2.5 : 1.2}
        border={`1px solid ${theme.customColors.dark15}`}
        spacing={2}
      >
        <AmountFeeInputs />
        {/*{(showRpcSelector || true) && <NetworkAutocomplete />}*/}
        <ToAddressAutocomplete disabled={disableInputs} />
        {isPokt && (
          <Controller
            control={control}
            name={"memo"}
            render={({ field }) => (
              <TextField
                label={"Memo"}
                fullWidth
                autoComplete={"off"}
                size={"small"}
                disabled={disableInputs}
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
