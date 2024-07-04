import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { sessionsMaxAgeSelector } from "../../../redux/selectors/preferences";
import ChangeSettingModal, { getLabelOfSetting } from "./ChangeSettingModal";
import { useAppSelector } from "../../hooks/redux";
import { themeColors } from "../../theme";

export default function KeepSessionActive() {
  const [showModal, setShowModal] = useState(false);
  const sessionsMaxAge = useAppSelector(sessionsMaxAgeSelector);

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
        <Typography color={themeColors.black}>Close Session After</Typography>
        <Stack direction={"row"} spacing={1} alignItems={"center"}>
          <Typography>{getLabelOfSetting(sessionsMaxAge)}</Typography>
          <ForwardIcon sx={{ color: themeColors.dark_gray1, fontSize: 16 }} />
        </Stack>
      </Button>
    </>
  );
}
