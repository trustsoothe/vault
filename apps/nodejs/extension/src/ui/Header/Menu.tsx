import React from "react";
import { Link } from "react-router-dom";
import MuiMenu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import MoreIcon from "../assets/img/more_icon.svg";
import { themeColors } from "../theme";
import {
  CONTACTS_PAGE,
  MANAGE_ACCOUNTS_PAGE,
  PREFERENCES_PAGE,
  SEEDS_PAGE,
} from "../../constants/routes";
import MenuDivider from "../components/MenuDivider";
import { useAccountDialogs } from "./context/AccountDialogs";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface RouteItem {
  type: "route";
  label: string;
  route: string;
}

interface ButtonItem {
  type: "button";
  label: string;
  onClick?: () => void;
  isSensitive?: boolean;
}

interface DividerItem {
  type: "divider";
}

type MenuItem = RouteItem | ButtonItem | DividerItem;

export default function Menu() {
  const { showCreateAccount, showImportAccount } = useAccountDialogs();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLButtonElement>(
    null
  );
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems: Array<MenuItem> = [
    {
      type: "button",
      label: "New Account",
      onClick: showCreateAccount,
    },
    {
      type: "button",
      label: "Import Account",
      onClick: showImportAccount,
    },
    {
      type: "route",
      label: "Seeds",
      route: SEEDS_PAGE,
    },
    {
      type: "route",
      label: "Manage Accounts",
      route: MANAGE_ACCOUNTS_PAGE,
    },
    {
      type: "divider",
    },
    {
      type: "route",
      label: "Contacts",
      route: CONTACTS_PAGE,
    },
    {
      type: "divider",
    },
    {
      type: "route",
      label: "Preferences",
      route: PREFERENCES_PAGE,
    },
    {
      type: "divider",
    },
    {
      type: "button",
      label: "Lock Vault",
      onClick: AppToBackground.lockVault,
      isSensitive: true,
    },
  ];

  return (
    <>
      <IconButton
        sx={{
          width: 33,
          height: 31,
          borderRadius: "8px",
          backgroundColor: themeColors.white,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
        }}
        onClick={handleClick}
      >
        <MoreIcon />
      </IconButton>
      <MuiMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              marginTop: 0.8,
            },
          },
        }}
      >
        {menuItems.map((menuItem, index) => {
          if (menuItem.type === "divider") {
            return <MenuDivider key={index} />;
          }

          if (menuItem.type === "button") {
            return (
              <MenuItem
                key={index}
                className={menuItem.isSensitive ? "sensitive" : undefined}
                onClick={() => {
                  menuItem.onClick();
                  handleClose();
                }}
              >
                {menuItem.label}
              </MenuItem>
            );
          }

          return (
            <MenuItem
              key={index}
              onClick={handleClose}
              sx={{
                padding: "0!important",
                "& a": {
                  height: 1,
                  width: 1,
                  paddingX: 1.4,
                  paddingY: 1.2,
                  boxSizing: "border-box",
                },
              }}
            >
              <Link to={menuItem.route}>{menuItem.label}</Link>
            </MenuItem>
          );
        })}
      </MuiMenu>
    </>
  );
}
