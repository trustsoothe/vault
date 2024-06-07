import React from "react";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Controller, useFormContext } from "react-hook-form";
import { nameRules } from "../NewAccount/NewAccountModal";

export default function NameAndWordsInput() {
  const { control } = useFormContext<{
    name: string;
    phraseSize: "12" | "15" | "18" | "21" | "24";
  }>();

  return (
    <Stack
      spacing={1.2}
      marginTop={1.2}
      direction={"row"}
      alignItems={"center"}
    >
      <Controller
        control={control}
        name={"name"}
        rules={nameRules}
        render={({ field, fieldState: { error } }) => (
          <TextField
            placeholder={"Seed Name"}
            autoComplete={"off"}
            {...field}
            error={!!error}
            helperText={error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name={"phraseSize"}
        render={({ field }) => (
          <TextField
            select
            {...field}
            sx={{
              width: 110,
              minWidth: 110,
              "& .MuiSelect-select": {
                paddingRight: "16px!important",
              },
            }}
          >
            {["12", "15", "18", "21", "24"].map((words) => (
              <MenuItem value={words} key={words}>
                {words} Words
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Stack>
  );
}
