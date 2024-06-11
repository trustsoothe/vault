import React from "react";
import Menu from "@mui/material/Menu";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { useAccountDialogs } from "../context/AccountDialogs";

interface AddAccountButtonProps {
  closeSelectModal: () => void;
}

export default function AddAccountButton({
  closeSelectModal,
}: AddAccountButtonProps) {
  const { showImportAccount, showCreateAccount } = useAccountDialogs();
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
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            showCreateAccount();
            handleClose();
            closeSelectModal();
          }}
        >
          New Account
        </MenuItem>
        <MenuItem
          onClick={() => {
            showImportAccount();
            handleClose();
            closeSelectModal();
          }}
        >
          Import Account
        </MenuItem>
      </Menu>
    </>
  );
}
