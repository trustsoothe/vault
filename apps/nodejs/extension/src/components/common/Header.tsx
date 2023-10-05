import React, { useCallback, useEffect, useMemo } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import browser from "webextension-polyfill";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { connect } from "react-redux";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import ReplyIcon from "@mui/icons-material/Reply";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ACCOUNTS_DETAIL_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  ASSETS_PAGE,
  BLOCK_SITE_PAGE,
  BLOCKED_SITES_PAGE,
  CONNECTED_SITE_DETAIL_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_ACCOUNT_PAGE,
  SESSIONS_PAGE,
  TRANSFER_PAGE,
  UNBLOCK_SITE_PAGE,
  UPDATE_ACCOUNT_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { RootState } from "../../redux/store";

const titleMap = {
  [ACCOUNTS_PAGE]: "Accounts",
  [ACCOUNTS_DETAIL_PAGE]: "Account Detail",
  [UPDATE_ACCOUNT_PAGE]: "Update Account Name",
  [REMOVE_ACCOUNT_PAGE]: "Remove Account",
  [ASSETS_PAGE]: "Assets",
  [CREATE_ACCOUNT_PAGE]: "Create Account",
  [IMPORT_ACCOUNT_PAGE]: "Import Account",
  [NETWORKS_PAGE]: "Networks",
  [ADD_NETWORK_PAGE]: "Add Network",
  [UPDATE_NETWORK_PAGE]: "Update Network",
  [REMOVE_ACCOUNT_PAGE]: "Remove Network",
  [SESSIONS_PAGE]: "Connected Sites",
  [CONNECTED_SITE_DETAIL_PAGE]: "Connection Detail",
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isPopup, setIsPopup] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;

  useEffect(() => {
    setIsPopup(window.location.search.includes("popup=true"));
  }, []);

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

  const items = useMemo(() => {
    switch (location.pathname) {
      case ACCOUNTS_PAGE: {
        return accountsLength;
      }
      case NETWORKS_PAGE: {
        return networksLength;
      }
      case ASSETS_PAGE: {
        return assetsLength;
      }
    }

    return 0;
  }, [accountsLength, networksLength, assetsLength, location]);

  const complementaryComponent = useMemo(() => {
    if (location.pathname === NETWORKS_PAGE) {
      return (
        <Button
          sx={{ textTransform: "none", height: 30, minWidth: 40, width: 40 }}
          onClick={() => navigate(ADD_NETWORK_PAGE)}
        >
          Add
        </Button>
      );
    }
    if (items) {
      return (
        <Stack
          justifyContent={"center"}
          alignItems={"center"}
          height={20}
          paddingX={"5px"}
          bgcolor={"#d3d3d3"}
          borderRadius={"4px"}
        >
          <Typography
            fontSize={10}
            fontWeight={600}
            color={"#454545"}
            letterSpacing={"0.5px"}
          >
            {items}
          </Typography>
        </Stack>
      );
    }

    if (location.pathname === SESSIONS_PAGE) {
      return (
        <Button
          sx={{ color: "red", fontWeight: 600 }}
          onClick={() => navigate(BLOCKED_SITES_PAGE)}
        >
          Blocks
        </Button>
      );
    }
  }, [items, navigate, location.pathname]);

  const canGoBack = location.key !== "default";

  return (
    <Stack flexGrow={1} height={510 - 15 - 20}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={35}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={"10px"}>
          <Typography variant={"h6"}>
            {titleMap[location.pathname] || "Keyring Vault"}
          </Typography>
          {complementaryComponent}
        </Stack>
        <Stack
          direction={"row"}
          alignItems={"center"}
          spacing={"5px"}
          marginRight={"-12px"}
        >
          <IconButton
            sx={{
              padding: 0,
              marginRight: "-5px",
              display: canGoBack ? "block" : "none",
            }}
            onClick={goBack}
          >
            <ReplyIcon />
          </IconButton>
          <IconButton sx={{ padding: 0 }} onClick={openMenu}>
            <MoreVertRoundedIcon />
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
            <Link to={SESSIONS_PAGE}>Connected Sites</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={NETWORKS_PAGE}>Networks</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={ASSETS_PAGE}>Assets</Link>
          </MenuItem>
        </Menu>
      </Stack>
      <Stack flexGrow={1} height={"calc(100% - 35px)"}>
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
