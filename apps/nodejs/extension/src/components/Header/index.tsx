import React, { useCallback, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import browser from "webextension-polyfill";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ContactIcon from "@mui/icons-material/AccountCircleOutlined";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import PreferencesIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  ACCOUNT_PK_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  BLOCK_SITE_PAGE,
  BLOCKED_SITES_PAGE,
  CONTACTS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  PREFERENCES_PAGE,
  REMOVE_CONTACT_PAGE,
  REMOVE_NETWORK_PAGE,
  SAVE_CONTACT_PAGE,
  SITES_PAGE,
  TRANSFER_PAGE,
  UNBLOCK_SITE_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";
import LogoIcon from "../../assets/img/logo.svg";
import useIsPopup from "../../hooks/useIsPopup";
import { HEIGHT, WIDTH } from "../../constants/ui";
import NetworkSelect from "./NetworkSelect";
import AccountSelect from "./AccountSelect";
import NewIcon from "../../assets/img/new_icon.svg";
import ImportIcon from "../../assets/img/import_icon.svg";
import TransferIcon from "../../assets/img/transfer_menu_icon.svg";
import SitesIcon from "../../assets/img/sites_icon.svg";
import NetworkIcon from "../../assets/img/network_icon.svg";
import LockIcon from "../../assets/img/lock_icon.svg";
import useShowAccountSelect, {
  ROUTES_TO_HIDE_ACCOUNT_SELECT,
} from "../../hooks/useShowAccountSelect";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import { existsAccountsOfSelectedProtocolSelector } from "../../redux/selectors/account";
import CreateModal from "../Account/CreateModal";

const titleMap = {
  [ACCOUNTS_PAGE]: "Account Details",
  [ACCOUNT_PK_PAGE]: "View Private Key",
  [IMPORT_ACCOUNT_PAGE]: "Import Account",
  [NETWORKS_PAGE]: "Networks",
  [ADD_NETWORK_PAGE]: "New RPC",
  [UPDATE_NETWORK_PAGE]: "Edit RPC",
  [REMOVE_NETWORK_PAGE]: "Remove RPC",
  [SITES_PAGE]: "Sites",
  [BLOCKED_SITES_PAGE]: "Blocked Sites",
  [UNBLOCK_SITE_PAGE]: "Unblock Site",
  [BLOCK_SITE_PAGE]: "Block Site",
  [TRANSFER_PAGE]: "New Transfer",
  [CONTACTS_PAGE]: "Contacts",
  [SAVE_CONTACT_PAGE]: "Add Contact",
  [REMOVE_CONTACT_PAGE]: "Remove Contact",
  [PREFERENCES_PAGE]: "Preferences",
  [EXPORT_VAULT_PAGE]: "Export Vault",
};

const getTitle = (path: string, search: string) => {
  if (path === SAVE_CONTACT_PAGE) {
    if (search.startsWith("?operation=updating")) {
      return "Update Contact";
    }
  }
  return titleMap[path] || "Soothe Vault";
};

const ROUTES_WHERE_HIDE_SELECTORS = [
  NETWORKS_PAGE,
  ADD_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
  SITES_PAGE,
  BLOCKED_SITES_PAGE,
  UNBLOCK_SITE_PAGE,
  BLOCK_SITE_PAGE,
  REMOVE_NETWORK_PAGE,
  CONTACTS_PAGE,
  REMOVE_CONTACT_PAGE,
  SAVE_CONTACT_PAGE,
  PREFERENCES_PAGE,
  EXPORT_VAULT_PAGE,
];

const routesWhereAccountNotNeeded = [
  ...ROUTES_TO_HIDE_ACCOUNT_SELECT,
  ...ROUTES_WHERE_HIDE_SELECTORS,
];

const Header = () => {
  const theme = useTheme();
  const isPopup = useIsPopup();
  const location = useLocation();
  const navigate = useNavigate();
  const showAccountSelect = useShowAccountSelect();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;
  const showSelectors = !ROUTES_WHERE_HIDE_SELECTORS.includes(
    location.pathname
  );

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setShowBackdrop(false);
  }, []);

  useEffect(() => {
    AppToBackground.shouldExportVault().then((res) => {
      if (res.data) {
        const { shouldExportVault, hasVaultBeenExported } = res.data;

        if (shouldExportVault) {
          const text = hasVaultBeenExported
            ? "It's been more than a week since you backup the vault."
            : "You haven't backup your vault yet.";

          enqueueSnackbar({
            variant: "info",
            persist: true,
            message: (onClickClose) => (
              <span>
                {text}{" "}
                <Button
                  onClick={() => {
                    onClickClose();
                    navigate(EXPORT_VAULT_PAGE);
                  }}
                  sx={{ padding: 0, minWidth: 0 }}
                >
                  Backup now?
                </Button>
              </span>
            ),
          });
        }
      }
    });
  }, []);

  const existsAccountsOfSelectedProtocol = useAppSelector(
    existsAccountsOfSelectedProtocolSelector
  );

  useEffect(() => {
    if (
      !routesWhereAccountNotNeeded.includes(location.pathname) &&
      !existsAccountsOfSelectedProtocol
    ) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [location.pathname, existsAccountsOfSelectedProtocol]);

  const toggleShowBackdrop = useCallback(() => {
    setShowBackdrop((prevState) => !prevState);
  }, []);

  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      toggleShowBackdrop();
    },
    [toggleShowBackdrop]
  );

  const canGoBack =
    location.key !== "default" && location.pathname !== ACCOUNTS_PAGE;

  const goBack = useCallback(() => {
    if (canGoBack) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [navigate, canGoBack]);

  const toggleShowCreateAccount = useCallback(() => {
    setShowCreateAccount((prevState) => !prevState);
    closeMenu();
  }, [closeMenu]);

  const onClickLock = useCallback(() => {
    AppToBackground.lockVault();
    closeMenu();
  }, [closeMenu]);

  const onClickExpand = useCallback(() => {
    browser.tabs.create({
      active: true,
      url: `home.html#${location.pathname}${location.search}`,
    });
  }, [location]);

  const headerHeight = 60;
  const selectorsContainerHeight = showSelectors ? 60 : 0;

  return (
    <Stack flexGrow={1} height={HEIGHT - headerHeight} position={"relative"}>
      <Stack
        height={showBackdrop ? "calc(100% - 40px)" : 0}
        width={1}
        flexGrow={1}
        top={60}
        position={"absolute"}
        zIndex={1}
        bgcolor={"rgba(255,255,255,0.5)"}
        sx={{
          transition: "height 0.1s",
          transitionTimingFunction: "ease-in",
        }}
      />
      <Stack
        direction={"row"}
        alignItems={"center"}
        height={headerHeight}
        width={1}
        maxWidth={WIDTH}
        bgcolor={theme.customColors.primary999}
        paddingLeft={0.5}
        boxSizing={"border-box"}
        sx={
          isPopup
            ? undefined
            : {
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
              }
        }
      >
        <LogoIcon />
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          marginLeft={1}
          flexGrow={1}
          height={34}
        >
          <Typography
            variant={"h6"}
            fontSize={16}
            fontWeight={700}
            color={"white"}
            marginRight={1}
          >
            {getTitle(location.pathname, location.search)}
          </Typography>
          <IconButton
            sx={{
              padding: 0,
              display: canGoBack ? "block" : "none",
            }}
            onClick={goBack}
          >
            <ArrowBackIcon
              sx={{
                fontSize: 25,
                color: theme.customColors.primary250,
                marginTop: 0.5,
              }}
            />
          </IconButton>
        </Stack>
        <Stack direction={"row"} alignItems={"center"} width={35}>
          <IconButton
            sx={{ padding: 0, width: 20, height: 25, marginLeft: 0.6 }}
            onClick={openMenu}
          >
            <MoreVertRoundedIcon
              sx={{ color: theme.customColors.white, fontSize: 30 }}
            />
          </IconButton>
        </Stack>

        <Menu
          open={open}
          onClose={closeMenu}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "*": {
              fontSize: "12px!important",
              color: theme.customColors.dark100,
              textDecoration: "none",
            },
            "& .MuiPaper-root": {
              width: 170,
              borderRadius: "6px",
              border: `1px solid ${theme.customColors.dark25}`,
              boxShadow: "2px 2px 14px 0px #1C2D4A33!important",
            },
            "& .MuiList-root": { paddingY: 0.5 },
            "& a": {
              width: 1,
              paddingY: "6px",
              display: "inline-block",
            },
          }}
        >
          {[
            {
              key: "new_account_item",
              label: "New Account",
              icon: NewIcon,
              onClick: toggleShowCreateAccount,
            },
            {
              key: "import_account_item",
              label: "Import Account",
              route: IMPORT_ACCOUNT_PAGE,
              icon: ImportIcon,
            },
            {
              key: "transfer_item",
              label: "Transfer",
              route: TRANSFER_PAGE,
              icon: TransferIcon,
            },
            {
              key: "divider_1_item",
              type: "divider",
            },
            {
              key: "sites_item",
              label: "Sites Connection",
              route: SITES_PAGE,
              icon: SitesIcon,
            },
            {
              key: "contacts_item",
              label: "Contacts",
              route: CONTACTS_PAGE,
              icon: () => (
                <ContactIcon
                  sx={{
                    fontSize: "13px!important",
                    marginLeft: 0.3,
                    "& path": {
                      color: `${theme.customColors.dark75}!important`,
                    },
                  }}
                />
              ),
            },
            {
              key: "networks_item",
              label: "Networks",
              route: NETWORKS_PAGE,
              icon: NetworkIcon,
            },
            {
              key: "divider_2_item",
              type: "divider",
            },
            {
              key: "expand_item",
              label: "Expand",
              onClick: onClickExpand,
              icon: () => (
                <OpenInFullIcon
                  sx={{
                    fontSize: 12,
                    paddingLeft: 0.3,
                    "& path": { color: theme.customColors.dark75 },
                  }}
                />
              ),
              hide: !isPopup,
            },
            {
              key: "export_item",
              label: "Export Vault",
              route: EXPORT_VAULT_PAGE,
              icon: () => (
                <DownloadIcon
                  sx={{
                    fontSize: 12,
                    paddingLeft: 0.3,
                    "& path": { color: theme.customColors.dark75 },
                  }}
                />
              ),
            },
            {
              key: "preferences_item",
              label: "Preferences",
              route: PREFERENCES_PAGE,
              icon: () => (
                <PreferencesIcon
                  sx={{
                    fontSize: 12,
                    paddingLeft: 0.3,
                    "& path": { color: theme.customColors.dark75 },
                  }}
                />
              ),
            },
            {
              key: "lock_item",
              label: "Lock Vault",
              onClick: onClickLock,
              icon: LockIcon,
              isLock: true,
            },
          ].map((item) => {
            if (item.type === "divider") {
              return (
                <Divider
                  key={item.key}
                  sx={{ marginY: "7px!important", marginX: 1 }}
                />
              );
            } else {
              if (item.hide) return null;

              const { icon: Icon, route, label, onClick, isLock } = item;
              return (
                <MenuItem
                  key={item.key}
                  onClick={onClick || closeMenu}
                  sx={{
                    minHeight: 30,
                    height: 30,
                    maxHeight: 30,
                    padding: "0px!important",
                    marginX: "10px",
                    ...(isLock && {
                      "& span": {
                        color: `${theme.customColors.red100}`,
                      },
                    }),
                    "&:hover": {
                      backgroundColor: isLock
                        ? theme.customColors.red100
                        : theme.customColors.primary500,
                      "& a, span": {
                        color: theme.customColors.white,
                        fontWeight: 700,
                      },
                      "& path": {
                        color: `${theme.customColors.white}!important`,
                      },
                      "& path[fill], circle[fill]": {
                        fill: theme.customColors.white,
                      },
                      "& path[stroke], circle[stroke]": {
                        stroke: theme.customColors.white,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: "20px!important",
                      marginRight: 0.5,
                    }}
                  >
                    <Icon />
                  </ListItemIcon>
                  <ListItemText>
                    {route ? (
                      <Link
                        to={route}
                        onClick={(event) => {
                          if (
                            !routesWhereAccountNotNeeded.includes(route) &&
                            !existsAccountsOfSelectedProtocol
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </ListItemText>
                </MenuItem>
              );
            }
          })}
        </Menu>
      </Stack>
      <Stack
        direction={"row"}
        paddingY={1.2}
        paddingX={1.5}
        spacing={1}
        height={selectorsContainerHeight}
        boxSizing={"border-box"}
        bgcolor={theme.customColors.primary100}
        display={showSelectors ? "flex" : "none"}
      >
        <NetworkSelect toggleShowBackdrop={toggleShowBackdrop} />
        {showAccountSelect && (
          <AccountSelect toggleShowBackdrop={toggleShowBackdrop} />
        )}
      </Stack>
      <Stack
        flexGrow={1}
        height={`calc(100% - ${headerHeight + selectorsContainerHeight}px)`}
        paddingX={2}
        position={"relative"}
      >
        <Outlet context={{ toggleShowCreateAccount }} />
      </Stack>
      <CreateModal open={showCreateAccount} onClose={toggleShowCreateAccount} />
    </Stack>
  );
};

export default Header;
