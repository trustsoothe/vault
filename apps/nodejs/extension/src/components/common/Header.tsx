import React, { useCallback } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Link, Outlet } from "react-router-dom";
import {
  ACCOUNTS_PAGE,
  ASSETS_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  SESSIONS_PAGE,
} from "../../constants/routes";
import { useAppDispatch } from "../../hooks/redux";
import { lockVault } from "../../redux/slices/vault";

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = !!anchorEl;

  const openMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const onClickLock = useCallback(() => {
    dispatch(lockVault());
    closeMenu();
  }, [closeMenu, dispatch]);

  return (
    <Stack flexGrow={1} height={510 - 15 - 20}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={35}
      >
        <Typography variant={"h5"}>Keyring Vault</Typography>
        <IconButton sx={{ padding: 0, marginRight: "-5px" }} onClick={openMenu}>
          <MoreVertRoundedIcon />
        </IconButton>
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
            <Link to={CREATE_ACCOUNT_PAGE}>Create account</Link>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <Link to={IMPORT_ACCOUNT_PAGE}>Import account</Link>
          </MenuItem>
          <MenuItem
            onClick={closeMenu}
            sx={{ borderTop: "1px solid lightgray" }}
          >
            <Link to={SESSIONS_PAGE}>Sessions</Link>
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

export default Header;
