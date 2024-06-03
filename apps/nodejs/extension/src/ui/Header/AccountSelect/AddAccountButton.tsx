import React from "react";
import Menu from "@mui/material/Menu";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { themeColors } from "../../theme";

export default function AddAccountButton() {
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
      <Button fullWidth variant={"contained"} onClick={handleClick}>
        Add Account
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl?.offsetWidth || 304,
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
        <MenuItem onClick={handleClose}>New Account</MenuItem>
        <MenuItem onClick={handleClose}>Import Account</MenuItem>
        <MenuItem onClick={handleClose}>HD Account</MenuItem>
      </Menu>
    </>
  );
}
