import React from "react";
import Chip from "@mui/material/Chip";
import { NetworkNotice } from "../../../redux/slices/app";

export interface NetworkNoticeTagProps {
  notice: NetworkNotice;
  onClick?: (tag: NetworkNotice) => void;
}

export default function NetworkNoticeTag({ notice, onClick }: NetworkNoticeTagProps) {
  const onClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(notice);
  };

  if (!notice || !notice.showAsTag) {
    return null;
  }

  return (
    <Chip
      title={notice.name}
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
      label={notice.name}
    />
  );
}
