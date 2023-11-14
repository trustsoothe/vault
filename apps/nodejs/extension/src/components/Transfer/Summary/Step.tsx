import type { EthereumNetworkFee, PocketNetworkFee } from "@poktscan/keyring";
import React from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import Password from "../../common/Password";
import Summary from "./Component";

interface SummaryStepProps {
  wrongPassword?: boolean;
  compact?: boolean;
  networkFee: PocketNetworkFee | EthereumNetworkFee;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  wrongPassword,
  compact = false,
  networkFee,
}) => {
  const theme = useTheme();

  return (
    <Stack flexGrow={1} justifyContent={"space-between"} maxHeight={255}>
      <Summary compact={compact} networkFee={networkFee} />

      <Stack
        spacing={compact ? 0.2 : 0.2}
        marginTop={`${compact ? 12 : 5}px!important`}
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
    </Stack>
  );
};

export default SummaryStep;
