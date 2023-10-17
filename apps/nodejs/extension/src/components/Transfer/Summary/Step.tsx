import type { FormValues } from "../index";
import React from "react";
import { useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import Password from "../../common/Password";
import Summary from "./Component";

interface SummaryStepProps {
  fromBalance: number;
  wrongPassword?: boolean;
  compact?: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  fromBalance,
  wrongPassword,
  compact = false,
}) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();

  const [fromType] = watch(["fromType"]);

  return (
    <Stack spacing={2}>
      <Summary fromBalance={fromBalance} compact={compact} />
      {fromType === "saved_account" && (
        <Stack
          spacing={compact ? 0.2 : 1.5}
          marginTop={`${compact ? 12 : 28}px!important`}
        >
          <Typography
            fontSize={13}
            fontWeight={500}
            lineHeight={"30px"}
            letterSpacing={"0.5px"}
            sx={{ userSelect: "none" }}
            color={theme.customColors.dark100}
          >
            To confirm, introduce the account password:
          </Typography>
          <Password
            justRequire={true}
            hidePasswordStrong={true}
            canGenerateRandom={false}
            passwordName={"accountPassword"}
            labelPassword={"Account Password"}
            errorPassword={wrongPassword ? "Wrong password" : undefined}
          />
        </Stack>
      )}
    </Stack>
  );
};

export default SummaryStep;
