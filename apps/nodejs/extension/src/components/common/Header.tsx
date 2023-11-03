import type { RootState } from "../../redux/store";
import React, { useCallback, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import browser from "webextension-polyfill";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { connect } from "react-redux";
import { useTheme } from "@mui/material";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import ReplyIcon from "@mui/icons-material/Reply";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  ACCOUNT_PK_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  ASSETS_PAGE,
  BLOCK_SITE_PAGE,
  BLOCKED_SITES_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_ACCOUNT_PAGE,
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
import AssetIcon from "../../assets/img/asset_icon.svg";
import LockIcon from "../../assets/img/lock_icon.svg";

const titleMap = {
  [ACCOUNTS_PAGE]: "Account Details",
  [ACCOUNT_PK_PAGE]: "View Private Key",
  [REMOVE_ACCOUNT_PAGE]: "Remove Account",
  [ASSETS_PAGE]: "Assets",
  [CREATE_ACCOUNT_PAGE]: "Create Account",
  [IMPORT_ACCOUNT_PAGE]: "Import Account",
  [NETWORKS_PAGE]: "Networks",
  [ADD_NETWORK_PAGE]: "New Network",
  [UPDATE_NETWORK_PAGE]: "Edit Network",
  [REMOVE_ACCOUNT_PAGE]: "Remove Network",
  [SITES_PAGE]: "Sites",
  [BLOCKED_SITES_PAGE]: "Blocked Sites",
  [UNBLOCK_SITE_PAGE]: "Unblock Site",
  [BLOCK_SITE_PAGE]: "Block Site",
  [TRANSFER_PAGE]: "New Transfer",
};

const ROUTES_WHERE_HIDE_SELECTORS = [
  NETWORKS_PAGE,
  ADD_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
  REMOVE_ACCOUNT_PAGE,
  SITES_PAGE,
  BLOCKED_SITES_PAGE,
  UNBLOCK_SITE_PAGE,
  BLOCK_SITE_PAGE,
];

const ROUTES_TO_HIDE_ACCOUNT_SELECT = [
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
];

interface HeaderProps {
  accountsLength: number;
  networksLength: number;
  assetsLength: number;
}

const Header: React.FC<HeaderProps> = ({
  accountsLength,
  networksLength,
  assetsLength,
}) => {
  const theme = useTheme();
  const isPopup = useIsPopup();
  const location = useLocation();
  const navigate = useNavigate();
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;

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

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    toggleShowBackdrop();
  }, [toggleShowBackdrop]);

  const canGoBack =
    location.key !== "default" && location.pathname !== ACCOUNTS_PAGE;

  const goBack = useCallback(() => {
    if (canGoBack) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [navigate, canGoBack]);

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

  const complementaryComponent = useMemo(() => {
    let items = 0;
    switch (location.pathname) {
      case ACCOUNTS_PAGE: {
        items = accountsLength;
        break;
      }
      case NETWORKS_PAGE: {
        items = networksLength;
        break;
      }
      case ASSETS_PAGE: {
        items = assetsLength;
        break;
      }
    }

    if (items) {
      return (
        <Stack
          justifyContent={"center"}
          alignItems={"center"}
          height={20}
          width={20}
          paddingX={0.3}
          borderRadius={"50%"}
          border={`1px solid ${theme.customColors.dark50}`}
          boxSizing={"border-box"}
        >
          <Typography
            fontSize={10}
            fontWeight={700}
            color={theme.customColors.white}
            letterSpacing={"0.5px"}
          >
            {items}
          </Typography>
        </Stack>
      );
    }
  }, [
    navigate,
    location.pathname,
    accountsLength,
    networksLength,
    assetsLength,
    theme,
  ]);

  const showSelectors = !ROUTES_WHERE_HIDE_SELECTORS.includes(
    location.pathname
  );
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
          width={280}
        >
          <Stack direction={"row"} alignItems={"center"}>
            <Typography
              variant={"h6"}
              fontSize={16}
              fontWeight={700}
              color={"white"}
              marginRight={1}
            >
              {titleMap[location.pathname] || "Keyring Vault"}
            </Typography>
          </Stack>
          <IconButton
            sx={{
              padding: 0,
              display: canGoBack ? "block" : "none",
            }}
            onClick={goBack}
          >
            <ReplyIcon
              sx={{ fontSize: 25, color: theme.customColors.primary250 }}
            />
          </IconButton>
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"center"}
          marginLeft={4.5}
          width={35}
        >
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
              label: "New Account",
              route: CREATE_ACCOUNT_PAGE,
              icon: NewIcon,
            },
            {
              label: "Import Account",
              route: IMPORT_ACCOUNT_PAGE,
              icon: ImportIcon,
            },
            {
              label: "Transfer",
              route: TRANSFER_PAGE,
              icon: TransferIcon,
            },
            {
              type: "divider",
            },
            {
              label: "Sites Connection",
              route: SITES_PAGE,
              icon: SitesIcon,
            },
            {
              label: "Networks",
              route: NETWORKS_PAGE,
              icon: NetworkIcon,
            },
            {
              label: "Assets",
              route: ASSETS_PAGE,
              icon: AssetIcon,
            },
            {
              type: "divider",
            },
            {
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
              label: "Lock Vault",
              onClick: onClickLock,
              icon: LockIcon,
              isLock: true,
            },
          ].map((item) => {
            if (item.type === "divider") {
              return <Divider sx={{ marginY: "7px!important", marginX: 1 }} />;
            } else {
              if (item.hide) return null;

              const { icon: Icon, route, label, onClick, isLock } = item;
              return (
                <MenuItem
                  onClick={onClick || closeMenu}
                  sx={{
                    minHeight: 30,
                    height: 30,
                    maxHeight: 30,
                    padding: "0px!important",
                    marginX: "10px",
                    ...(isLock && {
                      "& span": {
                        color: `${theme.customColors.red100}!important`,
                      },
                    }),
                    "&:hover": {
                      ...(isLock
                        ? {
                            "& a, span": {
                              color: theme.customColors.red100,
                              fontWeight: 700,
                            },
                          }
                        : {
                            backgroundColor: theme.customColors.primary500,
                            "& a, span": {
                              color: theme.customColors.white,
                              fontWeight: 700,
                            },
                            "& path": { color: theme.customColors.white },
                            "& path[fill], circle[fill]": {
                              fill: theme.customColors.white,
                            },
                            "& path[stroke], circle[stroke]": {
                              stroke: theme.customColors.white,
                            },
                          }),
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
                    {route ? <Link to={route}>{label}</Link> : label}
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
        {!ROUTES_TO_HIDE_ACCOUNT_SELECT.includes(location.pathname) && (
          <AccountSelect toggleShowBackdrop={toggleShowBackdrop} />
        )}
      </Stack>
      <Stack
        flexGrow={1}
        height={`calc(100% - ${headerHeight + selectorsContainerHeight}px)`}
        paddingX={2}
        position={"relative"}
      >
        <Outlet />
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    accountsLength: state.vault.entities.accounts.list.length,
    networksLength: state.vault.entities.networks.list.length,
    assetsLength: state.vault.entities.assets.list.length,
  };
};

export default connect(mapStateToProps)(Header);
