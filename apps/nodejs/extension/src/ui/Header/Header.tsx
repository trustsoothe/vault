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
import NewAccountModal from "../NewAccount/NewAccountModal";
import ImportAccountModal from "../ImportAccount/ImportAccountModal";
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
  const [modalToShow, setModalToShow] = useState<
    "none" | "create_account" | "import_account"
  >("none");

  const showCreateAccount = () => setModalToShow("create_account");
  const showImportAccount = () => setModalToShow("import_account");
  const closeModal = () => setModalToShow("none");

  return (
    <>
      <NewAccountModal
        open={modalToShow === "create_account"}
        onClose={closeModal}
      />
      <ImportAccountModal
        open={modalToShow === "import_account"}
        onClose={closeModal}
      />
      <Stack width={WIDTH} height={HEIGHT} position={"relative"}>
        {location.pathname === "/" ? (
          <HeaderContainer>
            <NetworkSelect />
            <AccountSelect />
            <Stack direction={"row-reverse"} flexGrow={1} spacing={1.6}>
              <Menu
                showCreateAccount={showCreateAccount}
                showImportAccount={showImportAccount}
              />
              <ConnectionStatus />
            </Stack>
          </HeaderContainer>
        ) : (
          <HeaderContainer justifyContent={"space-between"}>
            <BackButton />
            <Typography variant={"subtitle2"} textAlign={"center"}>
              {getLabelByRoute(location.pathname)}
            </Typography>
            <Menu
              showCreateAccount={showCreateAccount}
              showImportAccount={showImportAccount}
            />
          </HeaderContainer>
        )}
        <Stack
          flexGrow={1}
          height={`calc(100% - ${headerHeight}px)`}
          position={"relative"}
        >
          <Outlet context={{}} />
        </Stack>
      </Stack>
    </>
  );
}
