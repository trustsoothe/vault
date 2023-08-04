import React, { useCallback, useMemo } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import { connect } from "react-redux";
import MenuItem from "@mui/material/MenuItem";
import ReplyIcon from "@mui/icons-material/Reply";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ACCOUNTS_DETAIL_PAGE,
  ACCOUNTS_PAGE,
  ASSETS_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_ACCOUNT_PAGE,
  SESSIONS_PAGE,
  TRANSFER_PAGE,
  UPDATE_ACCOUNT_PAGE,
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
  [SESSIONS_PAGE]: "Connected Sites",
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
          <Stack
            justifyContent={"center"}
            alignItems={"center"}
            height={20}
            paddingX={"5px"}
            bgcolor={"#d3d3d3"}
            borderRadius={"4px"}
            display={items ? "flex" : "none"}
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
          <MenuItem
            onClick={closeMenu}
            sx={{ borderTop: "1px solid lightgray" }}
          >
            <Link to={ACCOUNTS_PAGE}>Home</Link>
          </MenuItem>
          <MenuItem
            onClick={closeMenu}
            sx={{ borderTop: "1px solid lightgray" }}
          >
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
