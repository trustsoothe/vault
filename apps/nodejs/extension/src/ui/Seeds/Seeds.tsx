import React from "react";
import Stack from "@mui/material/Stack";
import SeedsList from "./List";

export default function Seeds() {
  return (
    <Stack flexGrow={1}>
      <SeedsList />
    </Stack>
  );
}
