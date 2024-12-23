import React from "react";
import Chip from "@mui/material/Chip";
import { NetworkNotice } from "../../../redux/slices/app";

export interface NetworkNoticeTagProps {
  tag: NetworkNotice;
  onClick?: (tag: NetworkNotice) => void;
}

export default function NetworkNoticeTag({ tag, onClick }: NetworkNoticeTagProps) {
  const onClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(tag);
  };

  return (
    <Chip
      title={tag.name}
      onClick={onClickHandler}
      sx={{
        borderRadius: "4px",
        textTransform: "uppercase",
        maxHeight: "20px",
        fontWeight: 300,
        "& span": {
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          paddingLeft: "8px",
          paddingRight: "8px",
          maxWidth: "90px",
        }
      }}
      label={tag.name}
    />
  );
}
