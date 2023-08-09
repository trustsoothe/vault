import type { FormValues } from "../index";
import React from "react";
import { useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Summary from "./Component";

interface SummaryStepProps {
  fromBalance: number;
  wrongPassword?: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  fromBalance,
  wrongPassword,
}) => {
  const { watch, register, formState } = useFormContext<FormValues>();

  const [fromType] = watch(["fromType"]);

  return (
    <Stack spacing={2}>
      <Summary fromBalance={fromBalance} />
      {fromType === "saved_account" && (
        <TextField
          label={"Account Password"}
          fullWidth
          size={"small"}
          type={"password"}
          {...register("accountPassword", {
            required: "Required",
          })}
          error={!!formState?.errors?.accountPassword || wrongPassword}
          helperText={
            formState?.errors?.accountPassword?.message || wrongPassword
              ? "Wrong Password"
              : undefined
          }
          sx={{
            order: 2,
          }}
        />
      )}
    </Stack>
  );
};

export default SummaryStep;
