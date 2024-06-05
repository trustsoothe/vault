import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import PoktscanLogo from "../assets/img/poktscan_small_icon.svg";
import { explorerAccountUrlSelector } from "../../redux/selectors/network";
import { selectedAccountSelector } from "../../redux/selectors/account";
import { useAppSelector } from "../../hooks/redux";
import { themeColors } from "../theme";

export default function AccountActions() {
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const explorerAccountUrl = useAppSelector(explorerAccountUrlSelector());

  let explorerAccountLink: string, domain: string;

  if (explorerAccountUrl && selectedAccount?.address) {
    explorerAccountLink = explorerAccountUrl.replace(
      ":address",
      selectedAccount.address
    );

    const url = new URL(explorerAccountLink);
    domain = url.hostname;
  }

  return (
    <Stack
      flexGrow={1}
      spacing={1.2}
      paddingX={2.4}
      paddingY={2.5}
      bgcolor={themeColors.white}
    >
      <Button
        fullWidth
        component={"a"}
        target={"_blank"}
        href={explorerAccountLink}
        sx={{
          height: 55,
          paddingY: 1,
          paddingLeft: 1.5,
          paddingRight: 1.8,
          borderRadius: "8px",
          textDecoration: "none",
          boxSizing: "border-box",
          backgroundImage: "linear-gradient(to right, #f6f2ff 0%, #e8edfa)",
          "&:hover": {
            backgroundColor: themeColors.gray,
          },
        }}
      >
        <Stack width={1} direction={"row"}>
          <Stack flexGrow={1}>
            <Typography variant={"subtitle2"} color={themeColors.black}>
              Explore
            </Typography>
            <Typography>Open {domain}</Typography>
          </Stack>
          {selectedAccount?.protocol === SupportedProtocols.Pocket && (
            <Stack alignItems={"center"} justifyContent={"center"}>
              <PoktscanLogo />
            </Stack>
          )}
        </Stack>
      </Button>
    </Stack>
  );
}
