import React from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import BackIcon from "@mui/icons-material/ArrowBackIosRounded";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import { themeColors } from "../theme";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <IconButton
      onClick={() => navigate(ACCOUNTS_PAGE)}
      sx={{
        height: 31,
        width: 33,
        borderRadius: "8px",
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
    >
      <BackIcon sx={{ color: themeColors.dark_gray1, fontSize: 16 }} />
    </IconButton>
  );
}
