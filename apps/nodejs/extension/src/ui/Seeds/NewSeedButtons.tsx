import type { StackProps } from "@mui/material/Stack";
import React from "react";
import { useNavigate } from "react-router-dom";
import NewEntitiesButtons from "../components/NewEntitiesButtons";
import { IMPORT_SEEDS_PAGE, NEW_SEEDS_PAGE } from "../../constants/routes";

interface NewSeedButtonsProps {
  containerProps?: StackProps;
}

export default function NewSeedButtons({
  containerProps,
}: NewSeedButtonsProps) {
  const navigate = useNavigate();

  return (
    <NewEntitiesButtons
      containerProps={containerProps}
      importProps={{
        onClick: () => navigate(IMPORT_SEEDS_PAGE),
      }}
      createProps={{
        onClick: () => navigate(NEW_SEEDS_PAGE),
      }}
    />
  );
}
