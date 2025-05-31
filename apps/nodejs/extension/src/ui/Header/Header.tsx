import { styled } from "@mui/material";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Stack, { StackProps } from "@mui/material/Stack";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import BackButton from "./BackButton";
import { themeColors } from "../theme";
import { HEIGHT, WIDTH } from "../../constants/ui";
import NetworkSelect from "./NetworkSelect/NetworkSelect";
import AccountSelect from "./AccountSelect/AccountSelect";
import {
  ACCOUNTS_PAGE,
  ACTIVITY_PAGE,
  CONTACTS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_SEEDS_PAGE,
  MANAGE_ACCOUNTS_PAGE,
  NETWORKS_PAGE,
  NEW_SEEDS_PAGE,
  PREFERENCES_PAGE,
  SEEDS_PAGE,
  SITES_PAGE,
} from "../../constants/routes";
import NewAccountModal from "../NewAccount/NewAccountModal";
import ImportAccountModal from "../ImportAccount/ImportAccountModal";
import AccountDialogsProvider from "./context/AccountDialogs";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import ConnectionStatus from "./ConnectionStatus";
import Menu from "./Menu";

export const headerHeight = 48;

export const HeaderContainer = styled(Stack)<StackProps>(() => ({
  width: "100%",
  padding: "0px 12px",
  flexDirection: "row",
  height: headerHeight,
  alignItems: "center",
  boxSizing: "border-box",
  backgroundColor: themeColors.bgLightGray,
  borderBottom: `1px solid ${themeColors.borderLightGray}`,
}));

function getLabelByRoute(pathname: string) {
  switch (pathname) {
    case PREFERENCES_PAGE:
      return "Preferences";

    case SEEDS_PAGE:
      return "Seeds";

    case NEW_SEEDS_PAGE:
      return "New Seed";

    case IMPORT_SEEDS_PAGE:
      return "Import Seed";

    case MANAGE_ACCOUNTS_PAGE:
      return "Manage Accounts";

    case CONTACTS_PAGE:
      return "Contacts";

    case EXPORT_VAULT_PAGE:
      return "Backup";

    case NETWORKS_PAGE:
      return "Networks";

    case SITES_PAGE:
      return "Site Connections";

    case ACTIVITY_PAGE:
      return "Activity";

    default:
      return "Unknown";
  }
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setURLSearchParams] = useSearchParams();
  const selectedAsset = useSelectedAsset();
  const [modalToShow, setModalToShow] = useState<
    "none" | "create_account" | "import_account"
  >("none");

  const showCreateAccount = () => setModalToShow("create_account");
  const showImportAccount = () => setModalToShow("import_account");
  const closeModal = () => setModalToShow("none");

  useEffect(() => {
    const openImport = searchParams.get("openToImportFile") === "true";

    if (openImport) {
      showImportAccount();
    }
  }, []);

  const isInActivity = ACTIVITY_PAGE === location.pathname;

  return (
    <AccountDialogsProvider
      showImportAccount={showImportAccount}
      showCreateAccount={showCreateAccount}
    >
      <NewAccountModal
        open={modalToShow === "create_account"}
        onClose={closeModal}
      />
      <ImportAccountModal
        open={modalToShow === "import_account"}
        onClose={closeModal}
      />
      <Stack width={WIDTH} height={HEIGHT} position={"relative"}>
        {ACCOUNTS_PAGE === location.pathname || isInActivity ? (
          <HeaderContainer>
            {selectedAsset || isInActivity ? (
              <BackButton
                onClick={() => {
                  if (isInActivity) {
                    navigate(
                      `${ACCOUNTS_PAGE}${
                        selectedAsset ? `?asset=${selectedAsset.id}` : ""
                      }`
                    );
                  } else {
                    setURLSearchParams({});
                  }
                }}
              />
            ) : (
              <NetworkSelect />
            )}
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
          <Outlet />
        </Stack>
      </Stack>
    </AccountDialogsProvider>
  );
}
