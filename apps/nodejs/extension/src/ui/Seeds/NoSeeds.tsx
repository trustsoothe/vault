import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SeedIcon from "../assets/img/seed_icon.svg";
import GrayContainer from "../components/GrayContainer";
import NewSeedButtons from "./NewSeedButtons";
import { themeColors } from "../theme";

export default function NoSeeds() {
  return (
    <>
      <GrayContainer>
        <SeedIcon />
        <Typography width={240} marginTop={1.4} textAlign={"center"}>
          You do not have any Seeds yet. Please import or create a new Seed.
        </Typography>
        <NewSeedButtons />
      </GrayContainer>
      <Stack flexGrow={1} bgcolor={themeColors.white} />
    </>
  );
}
