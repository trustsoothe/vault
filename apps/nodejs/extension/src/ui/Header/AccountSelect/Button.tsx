import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import { themeColors } from "../../theme";
import AvatarByString from "../../components/AvatarByString";
import { selectedAccountSelector } from "../../../redux/selectors/account";
import { useAppSelector } from "../../../hooks/redux";
import ExpandIcon from "../../assets/img/expand_select_icon.svg";

interface AccountSelectButtonProps {
  onClick?: () => void;
}

export default function AccountSelectButton({
  onClick,
}: AccountSelectButtonProps) {
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);

  return (
    <Button
      disabled={!selectedAccount}
      sx={{
        width: 180,
        height: 31,
        paddingX: 1,
        minWidth: 60,
        paddingY: 0.8,
        marginLeft: 1.2,
        fontWeight: "400",
        overflow: "hidden",
        borderRadius: "8px",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        color: themeColors.black,
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
        justifyContent: selectedAccount ? "space-between" : "center",
      }}
      onClick={onClick}
    >
      {selectedAccount ? (
        <>
          <Stack direction="row" alignItems={"center"} spacing={0.7}>
            <AvatarByString string={selectedAccount.address} />
            <span>{selectedAccount.name}</span>
          </Stack>
          <ExpandIcon />
        </>
      ) : (
        "No Accounts"
      )}
    </Button>
  );
}
