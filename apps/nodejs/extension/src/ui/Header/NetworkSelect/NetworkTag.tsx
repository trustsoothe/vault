import React from "react";
import Chip from "@mui/material/Chip";
import { useSnackbar } from "notistack";
import { NetworkTag } from "../../../redux/slices/app";

export interface NetworkTagProps {
  tag: NetworkTag;
}

export default function NetworkTag({ tag }: NetworkTagProps) {
  const { enqueueSnackbar } = useSnackbar();

  const onMouseEnter = () => {
    enqueueSnackbar(`You hovered over ${tag.name}`, {
      variant: "info",
    });
  };

  return (
    <Chip
      onMouseEnter={onMouseEnter} // Trigger snackbar on hover
      sx={{
        borderRadius: "4px",
        textTransform: "uppercase",
        maxHeight: "20px",
        fontWeight: 300,
      }}
      label={tag.name}
    />
  );
}
