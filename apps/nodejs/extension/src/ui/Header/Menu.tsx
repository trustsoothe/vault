import React from "react";
import { styled } from "@mui/material";
import MuiMenu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Divider, { DividerProps } from "@mui/material/Divider";
import MoreIcon from "../assets/img/more_icon.svg";
import { themeColors } from "../theme";

const CustomDivider = styled(Divider)<DividerProps>(() => ({
  borderColor: themeColors.borderLightGray,
  marginLeft: "-6px",
  marginRight: "-6px",
  marginTop: "6px!important",
  marginBottom: "6px!important",
}));

export default function Menu() {
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

  // todo: add functionality to buttons on menu
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
                paddingX: 1.4,
                paddingY: 1.2,
                color: themeColors.black,
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleClose}>Import Account</MenuItem>
        <MenuItem onClick={handleClose}>New Account</MenuItem>
        <CustomDivider />
        <MenuItem onClick={handleClose}>HD Account</MenuItem>
      </MuiMenu>
    </>
  );
}
