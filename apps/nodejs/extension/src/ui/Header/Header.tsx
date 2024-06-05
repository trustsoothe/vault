import { styled } from "@mui/material";
import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import Stack, { StackProps } from "@mui/material/Stack";
import { Outlet, useLocation } from "react-router-dom";
import BackButton from "./BackButton";
import { themeColors } from "../theme";
import { HEIGHT, WIDTH } from "../../constants/ui";
import NetworkSelect from "./NetworkSelect/NetworkSelect";
import AccountSelect from "./AccountSelect/AccountSelect";
import { PREFERENCES_PAGE } from "../../constants/routes";
import ConnectionStatus from "./ConnectionStatus";
import Menu from "./Menu";

export const headerHeight = 64;

export const HeaderContainer = styled(Stack)<StackProps>(() => ({
  width: "100%",
  padding: "16px",
  flexDirection: "row",
  height: headerHeight,
  alignItems: "center",
  boxSizing: "border-box",
  backgroundColor: themeColors.bgLightGray,
  borderBottom: `1px solid ${themeColors.borderLightGray}`,
}));

function getLabelByRoute(pathname: string) {
  if (pathname === PREFERENCES_PAGE) return "Preferences";
}

export default function Header() {
  const location = useLocation();
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const toggleShowCreateAccount = () => {
    setShowCreateAccount((prevState) => !prevState);
    // closeMenu();
  };

  return (
    <Stack width={WIDTH} height={HEIGHT} position={"relative"}>
      {location.pathname === "/" ? (
        <HeaderContainer>
          <NetworkSelect />
          <AccountSelect />
          <Stack direction={"row-reverse"} flexGrow={1} spacing={1.6}>
            <Menu />
            <ConnectionStatus />
          </Stack>
        </HeaderContainer>
      ) : (
        <HeaderContainer justifyContent={"space-between"}>
          <BackButton />
          <Typography variant={"subtitle2"} textAlign={"center"}>
            {getLabelByRoute(location.pathname)}
          </Typography>
          <Menu />
        </HeaderContainer>
      )}
      <Stack
        flexGrow={1}
        height={`calc(100% - ${headerHeight}px)`}
        position={"relative"}
      >
        <Outlet context={{ toggleShowCreateAccount }} />
      </Stack>
    </Stack>
  );
}
