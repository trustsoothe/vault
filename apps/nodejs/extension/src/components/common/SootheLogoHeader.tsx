import React from "react";
import { useTheme } from "@mui/material";
import Stack, { type StackProps } from "@mui/material/Stack";
import SootheVaultLogo from "../../assets/img/soothe_vault_logo.svg";

interface SootheLogoHeaderProps {
  containerProps?: StackProps;
  compact?: boolean;
}

const SootheLogoHeader: React.FC<SootheLogoHeaderProps> = ({
  containerProps,
  compact = true,
}) => {
  const theme = useTheme();
  return (
    <Stack
      width={1}
      height={compact ? 70 : 110}
      minHeight={compact ? 70 : 110}
      alignItems={"center"}
      justifyContent={"center"}
      bgcolor={theme.customColors.dark2}
      borderBottom={`1px solid ${theme.customColors.dark15}`}
      {...containerProps}
      sx={{
        ...(compact && {
          "& svg": {
            width: 130,
            height: 43,
          },
        }),
        ...containerProps?.sx,
      }}
    >
      <SootheVaultLogo viewBox="0 0 200 67" />
    </Stack>
  );
};

export default SootheLogoHeader;
