import React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Controller, useFormContext } from "react-hook-form";
import RecipientAutocomplete from "../../Transaction/RecipientAutocomplete";
import MemoInput from "../MemoInput";

export default function DaoTransfer() {
  const { control, watch } = useFormContext<{
    daoAction: "dao_transfer" | "dao_burn";
    fromAddress: string;
    amount: string;
  }>();

  const daoAction = watch("daoAction");

  return (
    <>
      <Controller
        control={control}
        name={"daoAction"}
        render={({ field, fieldState: { error } }) => (
          <TextField
            label={"Action"}
            select
            required
            {...field}
            error={!!error}
            helperText={error?.message}
            sx={{
              "& .MuiFormHelperText-root": {
                fontSize: 11,
              },
              "& .MuiSelect-select": {
                paddingRight: "16px!important",
              },
              "& .MuiFormLabel-root": {
                marginTop: -0.7,
                display: field.value ? "none" : undefined,
              },
            }}
            InputLabelProps={{
              shrink: false,
            }}
          >
            <MenuItem value="dao_transfer">Transfer</MenuItem>
            <MenuItem value="dao_burn">Burn</MenuItem>
          </TextField>
        )}
      />
      <Controller
        control={control}
        name={"amount"}
        rules={{
          required: "Required",
          min: {
            value: 1 / 1e6,
            message: `Min is ${1 / 1e6} POKT`,
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            placeholder={`Amount (POKT)`}
            required
            fullWidth
            size={"small"}
            type={"number"}
            sx={{
              marginTop: 1.6,
              marginBottom: error ? 1 : undefined,
              "& input[type=number]": {
                "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                MozAppearance: "textfield",
              },
              "& .MuiFormHelperText-root": {
                marginLeft: 0,
                fontSize: 11,
                marginTop: 0.1,
              },
            }}
            error={!!error?.message}
            helperText={error?.message}
            {...field}
          />
        )}
      />
      {daoAction === "dao_transfer" && (
        <RecipientAutocomplete marginTop={1.6} label={"Recipient Address"} />
      )}
      <MemoInput />
    </>
  );
}
