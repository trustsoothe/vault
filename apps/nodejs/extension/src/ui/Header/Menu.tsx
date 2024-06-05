import React from "react";
import { styled } from "@mui/material";
import { Link } from "react-router-dom";
import MuiMenu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Divider, { DividerProps } from "@mui/material/Divider";
import MoreIcon from "../assets/img/more_icon.svg";
import { themeColors } from "../theme";
import { PREFERENCES_PAGE } from "../../constants/routes";

interface RouteItem {
  type: "route";
  label: string;
  route: string;
}

interface ButtonItem {
  type: "button";
  label: string;
  onClick?: () => void;
}

interface DividerItem {
  type: "divider";
}

type MenuItem = RouteItem | ButtonItem | DividerItem;

const CustomDivider = styled(Divider)<DividerProps>(() => ({
  borderColor: themeColors.borderLightGray,
  marginLeft: "-6px",
  marginRight: "-6px",
  marginTop: "6px!important",
  marginBottom: "6px!important",
}));

interface MenuProps {
  showCreateAccount: () => void;
  showImportAccount: () => void;
}

export default function Menu({
  showCreateAccount,
  showImportAccount,
}: MenuProps) {
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
      label: "Import Account",
      onClick: showImportAccount,
    },
    {
      type: "button",
      label: "New Account",
      onClick: showCreateAccount,
    },
    {
      type: "divider",
    },
    {
      type: "route",
      label: "Preferences",
      route: PREFERENCES_PAGE,
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
              // todo: move this styles to theme
              borderRadius: "8px",
              backgroundColor: themeColors.white,
              boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.16)",
              "& ul": {
                padding: 0.6,
              },
              "& li": {
                height: 40,
                minHeight: 40,
                maxHeight: 40,
                paddingX: 1.4,
                paddingY: 1.2,
                boxSizing: "border-box",
                color: themeColors.black,
                "& a": {
                  color: themeColors.black,
                  textDecoration: "none",
                },
              },
            },
          },
        }}
      >
        {menuItems.map((menuItem, index) => {
          if (menuItem.type === "divider") {
            return <CustomDivider key={index} />;
          }

          if (menuItem.type === "button") {
            return (
              <MenuItem
                key={index}
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
