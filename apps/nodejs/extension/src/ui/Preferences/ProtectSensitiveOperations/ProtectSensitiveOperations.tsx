import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useAppSelector } from "../../../hooks/redux";
import ChangeSettingModal from "./ChangeSettingModal";
import { requirePasswordForSensitiveOptsSelector } from "../../../redux/selectors/preferences";
import { themeColors } from "../../theme";

export default function ProtectSensitiveOperations() {
  const [showModal, setShowModal] = useState(false);
  const protectSensitiveOperations = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );

  const toggleShowModal = () => setShowModal((prev) => !prev);

  return (
    <>
      <ChangeSettingModal open={showModal} onClose={toggleShowModal} />
      <Button
        sx={{
          width: 1,
          height: 54,
          paddingX: 1.4,
          paddingY: 1.8,
          borderRadius: "8px",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: themeColors.bgLightGray,
        }}
        onClick={toggleShowModal}
      >
        <Typography color={themeColors.black}>
          Protect Sensitive Operations
        </Typography>
        <Stack direction={"row"} spacing={1} alignItems={"center"}>
          <Typography>{protectSensitiveOperations ? "Yes" : "No"}</Typography>
          <ForwardIcon sx={{ color: themeColors.dark_gray1, fontSize: 16 }} />
        </Stack>
      </Button>
    </>
  );
}
