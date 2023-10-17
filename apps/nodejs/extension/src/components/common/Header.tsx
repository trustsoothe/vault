import type { RootState } from "../../redux/store";
import React, { useCallback, useMemo } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import browser from "webextension-polyfill";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { connect } from "react-redux";
import { useTheme } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import ReplyIcon from "@mui/icons-material/Reply";
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
import { HEIGHT } from "../../constants/ui";
import NetworkSelect from "./NetworkSelect";

const titleMap = {
  [ACCOUNTS_PAGE]: "Accounts",
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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;

  const openMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const goBack = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    }
  }, [navigate, location.key]);

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

  const canGoBack = location.key !== "default";
  const headerHeight = 60;

  return (
    <Stack flexGrow={1} height={HEIGHT - headerHeight}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        height={headerHeight}
        width={1}
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
          marginLeft={4.5}
          flexGrow={1}
          height={34}
        >
          <NetworkSelect />
          {/*<Stack direction={"row"} alignItems={"center"}>*/}
          {/*  <Typography*/}
          {/*    variant={"h6"}*/}
          {/*    fontSize={16}*/}
          {/*    fontWeight={700}*/}
          {/*    color={"white"}*/}
          {/*    marginRight={1}*/}
          {/*  >*/}
          {/*    {titleMap[location.pathname] || "Keyring Vault"}*/}
          {/*  </Typography>*/}
          {/*  {complementaryComponent}*/}
          {/*</Stack>*/}
          {/*<IconButton*/}
          {/*  sx={{*/}
          {/*    padding: 0,*/}
          {/*    display: canGoBack ? "block" : "none",*/}
          {/*  }}*/}
          {/*  onClick={goBack}*/}
          {/*>*/}
          {/*  <ReplyIcon*/}
          {/*    sx={{ fontSize: 25, color: theme.customColors.primary250 }}*/}
          {/*  />*/}
          {/*</IconButton>*/}
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"center"}
          marginLeft={4.5}
          width={35}
        >
          <IconButton sx={{ padding: 0 }} onClick={openMenu}>
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
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "*": {
              fontSize: "14px!important",
              color: "black",
              textDecoration: "none",
            },
            "& .MuiMenuItem-root": {
              minHeight: 33,
              height: 33,
              maxHeight: 33,
              padding: 0,
              marginX: "10px",
            },
            "& a": {
              width: 1,
              padding: "6px",
            },
          }}
        >
          <MenuItem
            onClick={onClickLock}
            sx={{
              padding: "6px!important",
            }}
          >
            Lock
          </MenuItem>
          {isPopup && (
            <MenuItem
              onClick={onClickExpand}
              sx={{
                padding: "6px!important",
              }}
            >
              Expand
            </MenuItem>
          )}
          <MenuItem
            onClick={closeMenu}
            sx={{ borderTop: "1px solid lightgray" }}
          >
            <Link to={ACCOUNTS_PAGE}>Accounts</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={TRANSFER_PAGE}>Transfer</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={CREATE_ACCOUNT_PAGE}>Create account</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={IMPORT_ACCOUNT_PAGE}>Import account</Link>
          </MenuItem>
          <MenuItem
            onClick={closeMenu}
            sx={{ borderTop: "1px solid lightgray" }}
          >
            <Link to={SITES_PAGE}>Sites</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={NETWORKS_PAGE}>Networks</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={ASSETS_PAGE}>Assets</Link>
          </MenuItem>
        </Menu>
      </Stack>
      <Stack
        flexGrow={1}
        height={`calc(100% - ${headerHeight}px)`}
        paddingX={2}
        position={"relative"}
      >
        <Stack
          height={open ? "calc(100% + 20px)" : 0}
          width={1}
          flexGrow={1}
          position={"absolute"}
          zIndex={10}
          bgcolor={"rgba(255,255,255,0.5)"}
          sx={{
            transition: "height 0.1s",
            transitionTimingFunction: "ease-in",
          }}
        />
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
