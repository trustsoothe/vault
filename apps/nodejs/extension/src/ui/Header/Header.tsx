import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import { Outlet } from "react-router-dom";
import { themeColors } from "../theme";
import { HEIGHT, WIDTH } from "../../constants/ui";
import NetworkSelect from "./NetworkSelect/NetworkSelect";
import AccountSelect from "./AccountSelect/AccountSelect";
import ConnectionStatus from "./ConnectionStatus";
import Menu from "./Menu";

const headerHeight = 64;

export default function Header() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const toggleShowCreateAccount = () => {
    setShowCreateAccount((prevState) => !prevState);
    // closeMenu();
  };

  return (
    <Stack width={WIDTH} height={HEIGHT} position={"relative"}>
      <Stack
        width={1}
        padding={1.6}
        direction={"row"}
        height={headerHeight}
        boxSizing={"border-box"}
        bgcolor={themeColors.bgLightGray}
        borderBottom={`1px solid ${themeColors.borderLightGray}`}
      >
        <NetworkSelect />
        <AccountSelect />
        <Stack direction={"row-reverse"} flexGrow={1} spacing={1.6}>
          <Menu />
          <ConnectionStatus />
        </Stack>
      </Stack>
      <Stack
        flexGrow={1}
        height={`calc(100% - ${headerHeight}px)`}
        paddingX={2}
        position={"relative"}
      >
        <Outlet context={{ toggleShowCreateAccount }} />
      </Stack>
    </Stack>
  );
}
