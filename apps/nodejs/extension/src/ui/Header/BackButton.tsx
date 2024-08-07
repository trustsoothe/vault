import React from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import BackIcon from "../assets/img/back_icon.svg";
import { themeColors } from "../theme";

interface BackButtonProps {
  onClick?: () => void;
  flip?: boolean;
}

export default function BackButton({ onClick, flip }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <IconButton
      onClick={onClick || (() => navigate(ACCOUNTS_PAGE))}
      sx={{
        height: 31,
        width: 33,
        borderRadius: "8px",
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
        svg: {
          transform: flip ? "rotate(180deg)" : undefined,
        },
      }}
    >
      <BackIcon />
    </IconButton>
  );
}
