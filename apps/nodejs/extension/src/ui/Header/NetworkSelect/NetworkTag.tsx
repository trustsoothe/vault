import React from "react";
import Chip from "@mui/material/Chip";
import { NetworkTag } from "../../../redux/slices/app";

export interface NetworkTagProps {
  tag: NetworkTag;
  onClick?: (tag: NetworkTag) => void;
}

export default function NetworkTag({ tag, onClick }: NetworkTagProps) {
  const onClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(tag);
  };

  return (
    <Chip
      onClick={onClickHandler}
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
